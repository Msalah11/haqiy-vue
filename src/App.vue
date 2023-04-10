<script setup lang="ts">
import KWView from "@/views/KWView.vue";
import {useI18n} from "vue-i18n";
import {onBeforeMount} from "vue";
import SAView from "@/views/SAView.vue";
import UAEView from "@/views/UAEView.vue";
import QAView from "@/views/QAView.vue";
import OMView from "@/views/OMView.vue";
import BHView from "@/views/BHView.vue";

const {locale} = useI18n();

const changeLocal = (selectedLocale: string) => {
  locale.value = selectedLocale
  const htmlEl = document.querySelector('html');
  htmlEl.setAttribute('dir',locale.value == 'ar' ? 'rtl' : 'ltr');
}
onBeforeMount(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const localeQuery = urlParams.get('lang');

  if(window.location.href.includes('en') || (localeQuery && localeQuery == 'en')) {
    return changeLocal('en');
  }

  if(window.location.href.includes('vi') || (localeQuery && localeQuery == 'vi')) {
    return changeLocal('vi');
  }
})
</script>

<template>
<k-w-view/>
<!--  <s-a-view/>-->
<!--  <u-a-e-view/>-->
<!--  <q-a-view/>-->
<!--  <o-m-view/>-->
<!--  <b-h-view/>-->
</template>