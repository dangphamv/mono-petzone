export type PetSpecies = 'dog' | 'cat' | 'other'

export type PetGender = 'male' | 'female' | 'unknown'

export type Temperament = 'friendly' | 'shy' | 'aggressive' | 'normal'

export type NeuteredStatus = 'yes' | 'no' | 'unknown'

export interface Pet {
  id: string
  owner_id: string
  name: string
  species: PetSpecies
  breed?: string
  gender: PetGender
  date_of_birth?: string
  weight_kg?: number
  color?: string
  photos: string[]
  vaccination_records: VaccinationRecord[]
  allergies: string[]
  chronic_conditions: string[]
  current_medications: Medication[]
  is_neutered: NeuteredStatus
  temperament: Temperament
  sociable_with_others: 'yes' | 'no' | 'depends'
  special_needs_notes?: string
  emergency_vet_name?: string
  emergency_vet_phone?: string
  created_at: string
  updated_at: string
}

export interface VaccinationRecord {
  name: string
  date: string
  expiry_date?: string
  document_url?: string
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  notes?: string
}

export interface Breed {
  id: number
  species: PetSpecies
  name_vi: string
  name_en: string
  popularity_rank?: number
}
