const StepOverlay = ({ currentStep }) => {
  return (
    <>
      {currentStep === 1 && (
        <div className="instruction">Click on the candles to blow them out!</div>
      )}
      
      {currentStep === 1.5 && (
        <div className="instruction">Watch the knife cut the cake!</div>
      )}
      
      {currentStep === 2.5 && (
        <div className="birthday-message fade-in-scale">
          <h1 className="handwriting">Happiest Birthday</h1>
          <h2 className="handwriting name">Kareenaaa!</h2>
        </div>
      )}
      
      {currentStep === 3 && (
        <div className="instruction">Click on photos to explore memories</div>
      )}
    </>
  )
}

export default StepOverlay

