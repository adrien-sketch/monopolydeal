import { FeedbackButton } from './components/FeedbackButton'
import './App.css'

function App() {
  const handleFeedback = (feedback: string) => {
    console.log('Feedback received:', feedback)
  }

  return (
    <div>
      <h1>My App</h1>
      <FeedbackButton onSubmit={handleFeedback} />
    </div>
  )
}

export default App
