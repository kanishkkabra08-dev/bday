import { useState, useEffect, useRef } from 'react'
import BirthdayScene from './components/BirthdayScene'
import LoadingScreen from './components/LoadingScreen'
import StepOverlay from './components/StepOverlay'

function App() {
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleStepChange = (step) => {
    setCurrentStep(step)
  }

  return (
    <>
      {loading && <LoadingScreen />}
      <BirthdayScene currentStep={currentStep} onStepChange={handleStepChange} />
      <StepOverlay currentStep={currentStep} />
    </>
  )
}

export default App

