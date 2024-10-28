<template>
    <el-row :style="{height: $isMobile() ? '800px': '400px'}">
      <el-col :md="24" :xs="24">
        <world-bar :regionData="interestByRegionData" ref="worldBar"/>
      </el-col>
    </el-row>
</template>

<script lang="ts">
import WorldBar from "./WorldBar.vue";
import { defineComponent } from "vue";
import GeoMapDataItem from "@/dto/google-trend/GeoMapDataItem";
import GoogleTrendService from "@/service/GoogleTrendService";

export default defineComponent({
  components: {
    WorldBar,
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
      })
    }
  },
});
</script>
