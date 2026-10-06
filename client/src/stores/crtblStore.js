import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from 'src/boot/axios';

export const useCrtblStore = defineStore('crtbl', () => {
  const crtbl_workflow = ref(null);
  const crtbl_flowjob = ref(null);
  const reloadTask = ref(null);
  const rings = ref([]);

  async function loadJobOrFlow(task_id) {
    return new Promise((success, reject) => {
      api.get(`/crtbl/load/${task_id}`).then(ret => {
        if (ret && ret.status == 200) {
          const d = ret.data;
          if (d.stat.own)
            crtbl_flowjob.value = { stat: d.stat, data: d.data};
          else
            crtbl_workflow.value = { stat: d.stat, data: d.data };
          rings.value = d.rings;
          success(d);
        } else
          reject(`Error loading crtbl task`);
      }).catch(err => {
        reject(err);
      });
    })
  }
  async function loadWorkflow(task_id) {
    return api.get(`/crtbl/wrkflw/${task_id}`).then(ret => ret.data);
  }
  async function loadJob(task_id, job_id) {
    return api.get(`/crtbl/job/${task_id}/${job_id}`).then(ret => ret.data);
  }
  async function loadFlowInit(flow, ring) {
    rings.value = [];
    const ret = await api.get(`/crtbl/flowinit/${flow}/${ring}`);
    rings.value = [...ret.data.rings];
    return { own: true, ...ret.data };
  }
  function nextRing(currentRingOrder) {
    const nextRing = rings.value.find(ring => ring.order == currentRingOrder + 1);
    if (nextRing)
      return nextRing;
    return null;
  }
  function previousRing(currentRingOrder) {
    const previousRing = rings.value.find(ring => ring.order == currentRingOrder - 1);
    if (previousRing)
      return previousRing;
    return null;
  }
  return { crtbl_workflow, crtbl_flowjob, reloadTask, rings, loadJobOrFlow, loadWorkflow, loadJob, loadFlowInit, nextRing, previousRing };
});
