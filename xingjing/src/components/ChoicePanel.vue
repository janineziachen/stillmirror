<template>
  <div class="choice-panel" :class="{ visible }">
    <p class="choice-prompt">{{ prompt }}</p>

    <div v-if="!showInput">
      <div
        v-for="option in options"
        :key="option.id"
        class="choice-option"
        @click="selectOption(option)"
      >
        {{ option.text }}
      </div>
    </div>

    <TextInput
      v-if="showInput"
      :placeholder="inputPlaceholder"
      :visible="showInput"
      @submit="onInputSubmit"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TextInput from './TextInput.vue'

const props = defineProps({
  prompt: { type: String, required: true },
  options: { type: Array, required: true },
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['choose'])

const showInput = ref(false)
const inputPlaceholder = ref('')
const pendingOption = ref(null)

function selectOption(option) {
  if (option.hasInput) {
    pendingOption.value = option
    inputPlaceholder.value = option.inputPlaceholder || '写下你的想法……'
    showInput.value = true
  } else {
    emit('choose', { optionId: option.id, input: null })
  }
}

function onInputSubmit(text) {
  showInput.value = false
  emit('choose', { optionId: pendingOption.value.id, input: text })
}
</script>
