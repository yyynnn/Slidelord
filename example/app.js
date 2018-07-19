import React from 'react'
import styled from 'styled-components'
import { compose, withHandlers, withState } from 'recompact'
import { Slidelord } from 'slidelord'

const enchancer = compose(
  withState('volume', 'setVolume', 0),
  withHandlers({
    handleVolumeChange: props => value => {
      props.setVolume(value)
    }
  })
)

export const ExampleApp = enchancer(({ volume, handleVolumeChange }) => {
  return (
    <Slidelord
      value={volume}
      orientation="horizontal"
      onChange={handleVolumeChange}
    />
  )
})
