<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>

<template>
  <div class="slidev-error-block">
    <strong>Slidev playground error</strong>
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.slidev-error-block {
  border: 1px solid color-mix(in srgb, #e11d48 45%, white 15%);
  background: color-mix(in srgb, #e11d48 14%, transparent);
  border-radius: 12px;
  padding: 14px 16px;
}

.slidev-error-block p {
  margin: 8px 0 0;
}
</style>
