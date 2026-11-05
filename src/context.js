import { createContext, useContext } from 'react'
export const SpendlyContext = createContext(null)
export const useSpendly = () => useContext(SpendlyContext)
