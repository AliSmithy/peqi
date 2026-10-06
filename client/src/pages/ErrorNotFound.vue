<template>
  <div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 30vh">
        404
      </div>

      <div class="text-h2" style="opacity:.4">
        {{ $t("error.404") }}
      </div>

      <q-btn class="q-mt-xl" size="2rem" unelevated to="/" label="" , icon="home" no-caps />
    </div>
  </div>
</template>

<script setup>
//
</script>
