import { Route, Routes } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { ChooseWorkoutScreen } from './screens/ChooseWorkoutScreen'
import { ExerciseDetailScreen } from './screens/ExerciseDetailScreen'
import { ExercisesScreen } from './screens/ExercisesScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { HomeScreen } from './screens/HomeScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { WorkoutDetailScreen } from './screens/WorkoutDetailScreen'
import { WorkoutScreen } from './screens/WorkoutScreen'

export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/choose" element={<ChooseWorkoutScreen />} />
        <Route path="/workout/:id" element={<WorkoutScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/history/:id" element={<WorkoutDetailScreen />} />
        <Route path="/exercises" element={<ExercisesScreen />} />
        <Route path="/exercises/:id" element={<ExerciseDetailScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
      <TabBar />
    </>
  )
}
