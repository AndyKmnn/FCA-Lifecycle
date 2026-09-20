import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Gallery } from '../design/Gallery'
import { Landing } from '../site/Landing'
import { Team } from '../site/Team'
import { PresenterView } from './PresenterView'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<PresenterView />} />
        <Route path="/team" element={<Team />} />
        <Route path="/design" element={<Gallery />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}
