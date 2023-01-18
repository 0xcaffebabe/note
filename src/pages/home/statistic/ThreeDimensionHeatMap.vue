<style lang="less" scoped>
#stage {
  width: 100%;
  height: 400px;
}
</style>

<template>
  <div id="stage"></div>
</template>

<script lang="js">
/* 动态加载, 故障隔离 */
const d3l = import('https://cdn.jsdelivr.net/npm/d3@7/+esm')
const spritejs = import('https://unpkg.com/spritejs/dist/spritejs.esm.js')
const sprite3d = import('https://unpkg.com/sprite-extend-3d/dist/sprite-extend-3d.esm.js')
import api from '@/api'
import HeatMapUtils from "./HeatMapUtils";

let d3 = null
let Scene,Cube,Light,shaders = null

export default {
  setup() {

  },
  async mounted() {
    d3 = await d3l
    Scene = (await spritejs).Scene
    Cube = (await sprite3d).Cube
    Light = (await sprite3d).Light
    shaders = (await sprite3d).shaders

    await this.render()
  },
  data() {
    return {
      timer: null
    }
  },
  unmounted() {
    clearInterval(this.timer)
  },
  computed: {
    isDark() {
      return this.$store.state.isDarkMode;
    },
  },
  methods: {
    async getData() {
      let raw = await api.getCommitHeatmap()
      raw = HeatMapUtils.fillTimeRange(raw)
      const maxValue = raw
        .map((v) => v[1])
        .sort()
        .reverse()[0];
      const pieces = HeatMapUtils.generatePieces(maxValue, this.isDark)
      function findColor(pieces, val) {
        for (let p of pieces) {
          if (val >= p.gte && val <= p.lte) {
            return p.color
          }
        }
      }
      return raw.map(v => {
        return {
          date: v[0],
          count: v[1],
          color: findColor(pieces, v[1])
        }
      }
      )
    },
    async render() {
      const container = document.getElementById('stage');

      const scene = new Scene({
        container,
        displayRatio: 2,
      });

      const layer = scene.layer3d('fglayer', {
        ambientColor: [0.5, 0.5, 0.5, 1],
        camera: {
          fov: 35,
        },
      });
      layer.camera.attributes.pos = [0, 3, 4];
      layer.camera.lookAt([0, 0, 0]);

      const light = new Light({
        direction: [-3, -3, -1],
        color: [1, 1, 1, 1],
      });

      layer.addLight(light);

      const program = layer.createProgram({
        vertex: shaders.GEOMETRY.vertex,
        fragment: shaders.GEOMETRY.fragment,
        // cullFace: null,
      });

      const dataset = await this.getData();
      const max = d3.max(dataset, (a) => {
        return a.count;
      });

      /* globals d3 */
      const selection = d3.select(layer);
      const chart = selection.selectAll('cube')
        .data(dataset)
        .enter()
        .append(() => {
          return new Cube(program);
        })
        .attr('width', 0.14)
        .attr('depth', 0.14)
        .attr('height', 1)
        // Note: use scaleY. DONT use height directly because the change of height
        // will rebuild geometry(much slower).
        .attr('scaleY', 0.001)
        // .attr('scaleY', (d) => {
        //   return d.count / max;
        // })
        .attr('pos', (d, i) => {
          const x0 = -3.8 + 0.0717 + 0.0015;
          const z0 = -0.5 + 0.05 + 0.0015;
          const x = x0 + 0.143 * Math.floor(i / 7);
          const z = z0 + 0.143 * (i % 7);
          // return [x, 0.5 * d.count / max, z];
          return [x, 0, z];
        })
        .attr('colors', (d, i) => {
          return d.color;
        });


      const fragment = `
        precision highp float;
        precision highp int;
        varying vec4 vColor;
        varying vec2 vUv;
        void main() {
          float x = fract(vUv.x * 53.0);
          float y = fract(vUv.y * 7.0);
          x = smoothstep(0.0, 0.1, x) - smoothstep(0.9, 1.0, x);
          y = smoothstep(0.0, 0.1, y) - smoothstep(0.9, 1.0, y);
          gl_FragColor = vColor * (x + y);
        }    
      `;

      const axisProgram = layer.createProgram({
        vertex: shaders.TEXTURE.vertex,
        fragment,
        // cullFace: null,
      });

      const ground = new Cube(axisProgram, {
        width: 7.6,
        height: 0.1,
        y: -0.049, // not 0.05 to avoid z-fighting
        depth: 1,
        colors: 'rgba(0, 0, 0, 0.1)',
      });

      layer.append(ground);

      const linear = d3.scaleLinear()
        .domain([0, max])
        .range([0, 1.0]);

      chart.transition()
        .duration(2000)
        .attr('scaleY', (d, i) => {
          return linear(d.count);
        })
        .attr('y', (d, i) => {
          return 0.5 * linear(d.count);
        });

        function cameraPath(time, y) {
          const x = 4 * Math.sin(time);
          const z = 2 * Math.cos(time * 2) + 3;
          return [x, y, z];
        }

      layer.setOrbit();
        let i =0
      this.timer = setInterval(() => {
        requestAnimationFrame(() => {
          layer.camera.attributes.pos = cameraPath(i++ * 0.001 + 1, 1);
          layer.setOrbit();
        })
      }, 16)

      window.layer = layer;
    }
  }
}
</script>