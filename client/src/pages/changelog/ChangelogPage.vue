<template>
  <q-page class="q-pa-sm">
    <q-card flat bordered class="changelog-page">
      <q-card-section class="q-pa-sm">
        <div class="changelog-page__title">{{ t('changelog.title') }}</div>
        <div v-if="store.loading && !store.days.length" class="text-grey">{{ t('general.loading') }}</div>
        <div v-else-if="!store.days.length" class="text-grey">{{ t('changelog.empty') }}</div>
        <template v-else>
          <section v-for="day in store.days" :key="day.date" class="changelog-day">
            <div class="changelog-day__date">{{ formatDay(day.date) }}</div>
            <ul class="changelog-list">
              <li
                v-for="(item, i) in day.items"
                :key="i"
                class="changelog-item"
                :class="`is-${item.level || 'info'}`"
              >
                <span class="changelog-item__mark">{{ t(`changelog.level.${item.level || 'info'}`) }}</span>
                <span class="changelog-item__text">{{ localizedTitle(item.text) }}</span>
              </li>
            </ul>
          </section>
        </template>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChangelogStore } from 'stores/changelogStore'
import { localizedDateTime, localizedTitle } from 'src/utils/zenUtil'

const { t } = useI18n()
const store = useChangelogStore()

function formatDay(date) {
  const [y, m, d] = String(date).split('-').map(Number)
  if (!y || !m || !d)
    return date
  return localizedDateTime(new Date(y, m - 1, d), 'yyyy/MM/dd')
}

onMounted(async () => {
  await store.fetch()
  store.markSeen()
})
</script>

<style scoped>
.changelog-page {
  max-width: 72rem;
  margin-inline: auto;
  --changelog-sticky-bg: #fff;
}

.body--dark .changelog-page {
  --changelog-sticky-bg: var(--q-dark);
}

.changelog-page__title {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.changelog-day + .changelog-day {
  margin-top: 0.45rem;
}

.changelog-day__date {
  position: sticky;
  top: 0;
  z-index: 1;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.2rem 0.15rem;
  background-color: var(--changelog-sticky-bg);
  border-bottom: 1px solid color-mix(in srgb, currentColor 18%, transparent);
}

.changelog-list {
  list-style: none;
  margin: 0.2rem 0 0;
  padding: 0;
}

.changelog-item {
  display: grid;
  grid-template-columns: 8.5em 1fr;
  column-gap: 0.45rem;
  align-items: start;
  padding: 0.12rem 0.15rem;
  border-inline-start: 3px solid transparent;
  font-size: 0.88rem;
  line-height: 1.4;
}

.changelog-item.is-important {
  border-inline-start-color: var(--q-negative);
}

.changelog-item.is-notice {
  border-inline-start-color: var(--q-warning);
}

.changelog-item.is-info {
  border-inline-start-color: #9e9e9e;
}

.changelog-item.is-deny {
  border-inline-start-color: var(--q-accent);
}

.changelog-item__mark {
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.changelog-item.is-important .changelog-item__mark {
  color: var(--q-negative);
}

.changelog-item.is-notice .changelog-item__mark {
  color: var(--q-warning);
}

.changelog-item.is-info .changelog-item__mark {
  color: #757575;
}

.changelog-item.is-deny .changelog-item__mark {
  color: var(--q-accent);
}

.changelog-item__text {
  white-space: pre-wrap;
  word-break: break-word;
}

.body--dark .changelog-page .changelog-item.is-info {
  border-inline-start-color: #9e9e9e;
}

.body--dark .changelog-page .changelog-item.is-info .changelog-item__mark {
  color: #bdbdbd;
}
</style>
