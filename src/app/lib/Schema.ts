import { z } from "zod";


export const UserSchema = z.object({
    name: z.string(),
    role: z.string(),
})

export const PM_TODOSchema = z.object({
    title: z.string(),
    completed: z.boolean(),
    Isconfirm: z.boolean(),
    staff_name: z.string(),  
})

export const Staff_TODOSchema = z.object({
    title: z.string(),
    completed: z.boolean(),
    targetDate: z.string(),
})

export const ProjectSchema = z.object({
    title: z.string(),
    description: z.string(),
    status : z.string(),

})

export const WorkItemSchema = z.object({
    title: z.string(),
    isCompleted: z.boolean(),
    isConfirmed: z.boolean(),
    targetDate: z.string(),
    projectId: z.string().optional(),
    staffId: z.string().optional(),
})