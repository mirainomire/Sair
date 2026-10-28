<template>
  <img class="avatar" :src="imageSrc" :alt="name" @error="useFallback" />
</template>

<script setup lang="ts">
const props = defineProps<{ src: string; name: string }>()
const imageSrc = ref(props.src)

watch(() => props.src, (src) => {
  imageSrc.value = src
})

function useFallback() {
  imageSrc.value = '/brand/pilot.svg'
}
</script>
