export interface ChatMessageDto {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export interface AiChatRequestDto {
    messages: ChatMessageDto[]
}

export interface AiChatResponseDto {
    text: string
}

export interface RecommendSpotDto {
    id?: number | string
    name: string
    category: string
    address: string
    lat?: number
    lng?: number
}



