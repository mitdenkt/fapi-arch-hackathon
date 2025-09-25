export interface RouteConfig {
    required: {
        auth: boolean
        series: boolean
    }
}

export interface User {
    id: string | number
    name: string
}

export interface CreateUserRequest {
    name: string
}

export interface UpdateUserRequest {
    name: string
}