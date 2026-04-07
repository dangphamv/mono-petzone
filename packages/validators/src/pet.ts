import { z } from 'zod'

const vaccinationRecordSchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  expiry_date: z.string().optional(),
  document_url: z.string().url().optional(),
})

const medicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string(),
  frequency: z.string(),
  notes: z.string().optional(),
})

export const createPetSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.enum(['dog', 'cat', 'other']),
  breed: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'unknown']),
  date_of_birth: z.string().optional(),
  weight_kg: z.number().positive().max(200).optional(),
  color: z.string().max(50).optional(),
  photos: z.array(z.string().url()).min(1).max(10),
  vaccination_records: z.array(vaccinationRecordSchema).default([]),
  allergies: z.array(z.string()).default([]),
  chronic_conditions: z.array(z.string()).default([]),
  current_medications: z.array(medicationSchema).default([]),
  is_neutered: z.enum(['yes', 'no', 'unknown']).default('unknown'),
  temperament: z.enum(['friendly', 'shy', 'aggressive', 'normal']).default('normal'),
  sociable_with_others: z.enum(['yes', 'no', 'depends']).default('depends'),
  special_needs_notes: z.string().max(1000).optional(),
  emergency_vet_name: z.string().max(200).optional(),
  emergency_vet_phone: z.string().optional(),
})

export const updatePetSchema = createPetSchema.partial()

export type CreatePetInput = z.infer<typeof createPetSchema>
export type UpdatePetInput = z.infer<typeof updatePetSchema>
