import React from 'react'
import CalendarView from './components/CalendarView'
import { CssBaseline, Container, Typography } from '@mui/material'

export default function App() {
  return (
    <>
      <CssBaseline />
      <Container>
        <Typography variant="h4" sx={{ mt: 4, mb: 2 }} align="center">
          Market Seasonality Explorer
        </Typography>
        <CalendarView />
      </Container>
    </>
  )
}