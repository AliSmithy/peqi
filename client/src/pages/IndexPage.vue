<template>
  <q-page class="flex flex-center">
    <div class="column items-center">
      <div class="row justify-center text-h6 text-center q-pa-sm">{{ $t('general.appDescription') }}</div>
      <div class="column items-center q-gutter-sm q-pa-md logo-stack">
        <img src="../assets/logo-peqi.png" alt="PEQI" class="peqi-logo" />
        <img src="../assets/logo-naci.png" alt="NACI" class="naci-logo" />
      </div>
      <div class="row justify-center text-h6 text-center q-pa-sm">{{ $t('general.appOwner') }}</div>

      <div class="row justify-center q-pa-sm" style="opacity: 0.5; font-size: 1em;">
        <span>{{ $t('general.appPoweredBy') }}&nbsp;</span>
        <div class="sysio-brand">
          <span>SYS</span>
          <span class="sysio-i">i</span>
          <span class="sysio-o">o</span>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.peqi-logo {
  max-width: min(420px, 80vw);
  max-height: 200px;
  object-fit: contain;
  border-radius: 12px;
}

.naci-logo {
  max-width: min(240px, 50vw);
  max-height: 120px;
  object-fit: contain;
}
</style>
