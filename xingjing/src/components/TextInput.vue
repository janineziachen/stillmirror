<template>
  <div class="text-input-wrapper" v-if="visible">
    <input
      ref="inputRef"
      class="text-input-field"
      type="text"
      :placeholder="placeholder"
      v-model="text"
      @keydown.enter.prevent="submit"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  placeholder: { type: String, default: '' },
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['submit'])

const inputRef = ref(null)
const text = ref('')

function submit() {
  if (text.value.trim()) {
    emit('submit', text.value.trim())
    text.value = ''
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => inputRef.value?.focus())
  }
})
</script>
