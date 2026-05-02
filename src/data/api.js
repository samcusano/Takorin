// Data access layer — all functions currently return static mock data.
// Replace each function body with a fetch() call when the backend is ready.
// API_BASE would come from import.meta.env.VITE_API_URL

import * as mock from './index.js'

export const getShiftData    = async () => mock.shiftData
export const getHandoffData  = async () => mock.handoffData
export const getSupplierData = async () => mock.supplierData
export const getCapaData     = async () => mock.capaData
export const getReadinessData = async () => mock.readinessData
