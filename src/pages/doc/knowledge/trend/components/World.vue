<template>
    <el-row :style="{height: $isMobile() ? '800px': '400px'}">
      <el-col :md="12" :xs="24">
        <world-map :regionData="interestByRegionData" ref="worldMap"/>
      </el-col>
      <el-col :md="12" :xs="24">
        <world-bar :regionData="interestByRegionData" ref="worldBar"/>
      </el-col>
    </el-row>
</template>

<script lang="ts">
import WorldBar from "./WorldBar.vue";
import WorldMap from "./WorldMap.vue";
import { defineComponent } from "vue";
import GeoMapDataItem from "@/dto/google-trend/GeoMapDataItem";
import GoogleTrendService from "@/service/GoogleTrendService";

export default defineComponent({
  components: {
    WorldBar,
    WorldMap
  },
  setup() {},
  data() {
    return {
      interestByRegionData: [] as GeoMapDataItem[],
    }
  },
  methods: {
    async init(kw: string) {
      this.interestByRegionData = (await GoogleTrendService.interestByRegion(kw)).default.geoMapData
      this.$nextTick(() => {
        (this.$refs.worldBar as InstanceType<typeof WorldBar>).init();
        (this.$refs.worldMap as InstanceType<typeof WorldMap>).init();
      })
    }
  },
});
</script>
