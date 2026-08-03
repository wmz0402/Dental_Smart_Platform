import { ref, onMounted, onUnmounted, computed } from 'vue'

const screenWidth = ref(window.innerWidth)

function updateWidth() {
  screenWidth.value = window.innerWidth
}

export function useResponsive() {
  onMounted(() => {
    window.addEventListener('resize', updateWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth)
  })

  const isMobile = computed(() => screenWidth.value < 768)
  const isTablet = computed(() => screenWidth.value >= 768 && screenWidth.value < 1024)
  const isDesktop = computed(() => screenWidth.value >= 1024)

  return {
    screenWidth,
    isMobile,
    isTablet,
    isDesktop
  }
}
