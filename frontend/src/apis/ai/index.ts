import http from '@/apis/http'
import type {
    AiChatRequestDto,
    AiChatResponseDto
} from './types'

// /ai/chat (Generic Chat)
export const sendAiChat = async (data: AiChatRequestDto): Promise<AiChatResponseDto> => {
    const response = await http.post<AiChatResponseDto>('/ai/chat', data)
    return response.data
}
