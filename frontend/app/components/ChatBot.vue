<template>
  <div class="fixed bottom-4 right-4 z-50 font-sans">
    <div
      v-if="!isOpen"
      @click="toggleChat"
      class="bg-[#4D4D4D] hover:bg-[#3D3D3D] text-white p-4 rounded-full shadow-lg cursor-pointer transition-all duration-300 flex items-center justify-center"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </div>

    <!-- Chat Window -->
    <div
      v-if="isOpen"
      class="w-full max-w-[450px] h-[80vh] sm:h-[700px] sm:w-[450px] bg-white shadow-lg rounded-xl flex flex-col overflow-hidden"
    >
      
      <!-- Header -->
      <div class="bg-[#4D4D4D] px-4 py-3 flex justify-between items-center rounded-t-xl">
        <div class="flex items-center space-x-3">
          <div class="bg-white p-2 rounded-full">
            <img src="/logo/logo4.png" alt="Logo" class="w-5 h-5" />
          </div>
          <span class="font-semibold text-lg text-white">
            Thế giới di động
          </span>
        </div>
        <button
          @click="toggleChat"
          class="text-white font-bold hover:text-gray-300 text-xl"
        >
          ✕
        </button>
      </div>

      <!-- Messages Container -->
      <div
        ref="messagesContainer"
        class="flex-1 p-3 space-y-3 overflow-y-auto bg-gray-50"
      >
        <div v-if="messages.length === 0" class="text-center text-gray-500 mt-8">
          <p>Chào mừng bạn đến với Thế Giới Di Động!</p>
          <p class="text-sm mt-1">Hãy gửi tin nhắn để bắt đầu trò chuyện.</p>
        </div>
        
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="flex items-start"
          :class="message.user === 'user' ? 'justify-end' : 'justify-start'"
        >
          <!-- Admin Avatar -->
          <div v-if="message.user === 'admin'" class="bg-white p-2 rounded-full mt-1 mr-2">
            <img src="/logo/logo4.png" alt="Admin" class="w-4 h-4" />
          </div>
          
          <!-- Message Bubble -->
          <div
            class="p-3 rounded-lg max-w-[70%] break-words"
            :class="message.user === 'user' 
              ? 'bg-[#4D4D4D] text-white rounded-br-sm' 
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'"
          >
            <p class="text-sm">{{ message.text }}</p>
            <span v-if="message.timestamp" class="text-xs opacity-70 mt-1 block">
              {{ formatTime(message.timestamp) }}
            </span>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="isTyping" class="flex justify-start items-start">
          <div class="bg-white p-2 rounded-full mt-1 mr-2">
            <img src="/logo/logo4.png" alt="Admin" class="w-4 h-4" />
          </div>
          <div class="bg-white text-gray-800 border border-gray-200 p-3 rounded-lg rounded-bl-sm">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div
                class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style="animation-delay: 0.1s"
              ></div>
              <div
                class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style="animation-delay: 0.2s"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-3 border-t border-gray-200 bg-white rounded-b-xl">
        <div class="flex gap-2 items-center">
          <button class="p-2 rounded hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>
          
          <input
            v-model="inputMessage"
            @keydown.enter="sendMessage"
            @input="handleTyping"
            type="text"
            placeholder="Nhập tin nhắn..."
            class="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D4D4D] focus:border-transparent"
          />
          
          <button
            @click="sendMessage"
            :disabled="!inputMessage.trim()"
            class="bg-[#4D4D4D] hover:bg-[#3D3D3D] disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

interface Message {
  user: 'user' | 'admin'
  text: string
  timestamp?: string
}

// Reactive state
const isOpen = ref(false)
const messages = ref<Message[]>([])
const inputMessage = ref('')
const isTyping = ref(false)
const messagesContainer = ref<HTMLElement>()

// Socket.IO connection - using any to avoid TypeScript issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let socket: any = null
let typingTimeout: NodeJS.Timeout | null = null

// Initialize socket connection
const initSocket = async () => {
  try {
    // Dynamic import to avoid TypeScript issues
    const { io } = await import('socket.io-client')
    
    const config = useRuntimeConfig()
    const socketUrl = config.public.apiBaseUrl?.replace('/api/v1', '') || `${window.location.protocol}//${window.location.hostname}:3001`
    
    socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log('Connected to chat server')
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from chat server')
    })

    socket.on('load_messages', (msgs: Message[]) => {
      messages.value = msgs
      scrollToBottom()
    })

    socket.on('receive_message', (message: Message) => {
      // Avoid duplicate messages
      const isDuplicate = messages.value.some(msg => 
        msg.user === message.user && 
        msg.text === message.text && 
        Math.abs(new Date(msg.timestamp || '').getTime() - new Date(message.timestamp || '').getTime()) < 1000
      )
      
      if (!isDuplicate) {
        messages.value.push(message)
        scrollToBottom()
      }
    })

    socket.on('user_typing', (data: { user: string, isTyping: boolean }) => {
      if (data.user !== 'user') {
        isTyping.value = data.isTyping
        if (data.isTyping) {
          scrollToBottom()
        }
      }
    })

    socket.on('error', (error: Error) => {
      console.error('Socket error:', error)
    })
  } catch (error) {
    console.error('Failed to initialize socket:', error)
  }
}

// Toggle chat window
const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// Send message
const sendMessage = () => {
  if (!inputMessage.value.trim() || !socket) return

  socket.emit('send_message', {
    text: inputMessage.value.trim()
  })

  inputMessage.value = ''
  
  // Stop typing indicator
  if (typingTimeout) {
    clearTimeout(typingTimeout)
    typingTimeout = null
  }
  socket.emit('typing', { isTyping: false })
}

// Handle typing indicator
const handleTyping = () => {
  if (!socket) return

  socket.emit('typing', { isTyping: true })

  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }

  typingTimeout = setTimeout(() => {
    socket?.emit('typing', { isTyping: false })
  }, 1000)
}

// Scroll to bottom of messages
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Format timestamp
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Watch for new messages to auto-scroll
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

// Lifecycle hooks
onMounted(() => {
  initSocket()
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }
})
</script>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Animation for typing indicator */
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out both;
}
</style>
