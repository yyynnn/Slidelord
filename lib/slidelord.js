import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ResizeObserver from 'resize-observer-polyfill'
import styled from 'styled-components'

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.substr(1)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

const constants = {
  orientation: {
    horizontal: {
      dimension: 'width',
      direction: 'left',
      reverseDirection: 'right',
      coordinate: 'x'
    },
    vertical: {
      dimension: 'height',
      direction: 'top',
      reverseDirection: 'bottom',
      coordinate: 'y'
    }
  }
}

export class Slidelord extends Component {
  static propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    orientation: PropTypes.string,
    tooltip: PropTypes.bool,
    reverse: PropTypes.bool,
    labels: PropTypes.object,
    handleLabel: PropTypes.string,
    format: PropTypes.func,
    onChangeStart: PropTypes.func,
    onChange: PropTypes.func,
    onChangeComplete: PropTypes.func,
    getLastValue: PropTypes.func
  }

  static defaultProps = {
    min: 0,
    max: 100,
    step: 1,
    value: 0,
    orientation: 'horizontal',
    tooltip: true,
    reverse: false,
    labels: {},
    handleLabel: '',
    getLastValue: () => {}
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      active: false,
      limit: 0,
      grab: 0
    }
  }

  componentDidMount() {
    this.handleUpdate()
    const resizeObserver = new ResizeObserver(this.handleUpdate)
    resizeObserver.observe(this.slider)
  }

  /**
   * Format label/tooltip value
   * @param  {Number} - value
   * @return {Formatted Number}
   */
  handleFormat = value => {
    const { format } = this.props
    return format ? format(value) : value
  }

  /**
   * Update slider state on change
   * @return {void}
   */
  handleUpdate = () => {
    if (!this.slider) {
      // for shallow rendering
      return
    }
    const { orientation } = this.props
    const dimension = capitalize(constants.orientation[orientation].dimension)
    const sliderPos = this.slider[`offset${dimension}`]
    const handlePos = this.handle[`offset${dimension}`]

    this.setState({
      limit: sliderPos - handlePos,
      grab: handlePos / 2
    })
  }

  /**
   * Attach event listeners to mousemove/mouseup events
   * @return {void}
   */
  handleStart = e => {
    const { onChangeStart } = this.props
    document.addEventListener('mousemove', this.handleDrag)
    document.addEventListener('mouseup', this.handleEnd)
    this.setState(
      {
        active: true
      },
      () => {
        onChangeStart && onChangeStart(e)
      }
    )
  }

  /**
   * Handle drag/mousemove event
   * @param  {Object} e - Event object
   * @return {void}
   */
  handleDrag = e => {
    e.stopPropagation()
    const { onChange } = this.props
    const {
      target: { classList, dataset }
    } = e
    if (!onChange) return

    let value = this.position(e)

    if (classList && dataset.value) {
      value = parseFloat(dataset.value)
    }

    onChange && onChange(value, e)
  }

  /**
   * Detach event listeners to mousemove/mouseup events
   * @return {void}
   */
  handleEnd = e => {
    const { onChangeComplete } = this.props
    this.props.getLastValue(this.props.value)
    this.setState(
      {
        active: false
      },
      () => {
        onChangeComplete && onChangeComplete(e)
      }
    )
    document.removeEventListener('mousemove', this.handleDrag)
    document.removeEventListener('mouseup', this.handleEnd)
  }

  /**
   * Support for key events on the slider handle
   * @param  {Object} e - Event object
   * @return {void}
   */
  handleKeyDown = e => {
    e.preventDefault()
    const { keyCode } = e
    const { value, min, max, step, onChange } = this.props
    let sliderValue

    switch (keyCode) {
      case 38:
      case 39:
        sliderValue = value + step > max ? max : value + step
        onChange && onChange(sliderValue, e)
        break
      case 37:
      case 40:
        sliderValue = value - step < min ? min : value - step
        onChange && onChange(sliderValue, e)
        break
    }
  }

  /**
   * Calculate position of slider based on its value
   * @param  {number} value - Current value of slider
   * @return {position} pos - Calculated position of slider based on value
   */
  getPositionFromValue = value => {
    const { limit } = this.state
    const { min, max } = this.props
    const diffMaxMin = max - min
    const diffValMin = value - min
    const percentage = diffValMin / diffMaxMin
    const pos = Math.round(percentage * limit)

    return pos
  }

  /**
   * Translate position of slider to slider value
   * @param  {number} pos - Current position/coordinates of slider
   * @return {number} value - Slider value
   */
  getValueFromPosition = pos => {
    const { limit } = this.state
    const { orientation, min, max, step } = this.props
    const percentage = clamp(pos, 0, limit) / (limit || 1)
    const baseVal = step * Math.round((percentage * (max - min)) / step)
    const value = orientation === 'horizontal' ? baseVal + min : max - baseVal

    return clamp(value, min, max)
  }

  /**
   * Calculate position of slider based on value
   * @param  {Object} e - Event object
   * @return {number} value - Slider value
   */
  position = e => {
    const { grab } = this.state
    const { orientation, reverse } = this.props

    const node = this.slider
    const coordinateStyle = constants.orientation[orientation].coordinate
    const directionStyle = reverse
      ? constants.orientation[orientation].reverseDirection
      : constants.orientation[orientation].direction
    const clientCoordinateStyle = `client${capitalize(coordinateStyle)}`
    const coordinate = !e.touches
      ? e[clientCoordinateStyle]
      : e.touches[0][clientCoordinateStyle]
    const direction = node.getBoundingClientRect()[directionStyle]
    const pos = reverse
      ? direction - coordinate - grab
      : coordinate - direction - grab
    const value = this.getValueFromPosition(pos)

    return value
  }

  /**
   * Grab coordinates of slider
   * @param  {Object} pos - Position object
   * @return {Object} - Slider fill/handle coordinates
   */
  coordinates = pos => {
    const { limit, grab } = this.state
    const { orientation } = this.props
    const value = this.getValueFromPosition(pos)
    const position = this.getPositionFromValue(value)
    const handlePos = orientation === 'horizontal' ? position + grab : position
    const fillPos = orientation === 'horizontal' ? handlePos : limit - handlePos

    return {
      fill: fillPos,
      handle: handlePos,
      label: handlePos
    }
  }

  renderLabels = labels => (
    <RangeLabels
      innerRef={sl => {
        this.labels = sl
      }}
    >
      {labels}
    </RangeLabels>
  )

  render() {
    const {
      value,
      orientation,
      tooltip,
      reverse,
      labels,
      min,
      max,
      handleLabel
    } = this.props
    const { active } = this.state
    const dimension = constants.orientation[orientation].dimension
    const direction = reverse
      ? constants.orientation[orientation].reverseDirection
      : constants.orientation[orientation].direction
    const position = this.getPositionFromValue(value)
    const coords = this.coordinates(position)
    const fillStyle = { [dimension]: `${coords.fill}px` }
    const handleStyle = { [direction]: `${coords.handle}px` }
    let showTooltip = tooltip && active

    let labelItems = []
    let labelKeys = Object.keys(labels)

    if (labelKeys.length > 0) {
      labelKeys = labelKeys.sort((a, b) => (reverse ? a - b : b - a))

      for (let key of labelKeys) {
        const labelPosition = this.getPositionFromValue(key)
        const labelCoords = this.coordinates(labelPosition)
        const labelStyle = { [direction]: `${labelCoords.label}px` }

        labelItems.push(
          <RangeLabelItem
            key={key}
            data-value={key}
            onMouseDown={this.handleDrag}
            onTouchStart={this.handleStart}
            onTouchEnd={this.handleEnd}
            style={labelStyle}
            orientation={orientation}
          >
            {this.props.labels[key]}
          </RangeLabelItem>
        )
      }
    }

    return (
      <RangeWrapper
        innerRef={s => {
          return (this.slider = s)
        }}
        reverse={reverse}
        orientation={orientation}
        onMouseDown={this.handleDrag}
        onMouseUp={this.handleEnd}
        onTouchStart={this.handleStart}
        onTouchEnd={this.handleEnd}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-orientation={orientation}
      >
        <RangeFill style={fillStyle} orientation={orientation} />
        <RangeHandle
          innerRef={sh => {
            this.handle = sh
          }}
          onMouseDown={this.handleStart}
          onTouchMove={this.handleDrag}
          onTouchEnd={this.handleEnd}
          onKeyDown={this.handleKeyDown}
          orientation={orientation}
          style={handleStyle}
          tabIndex={0}
          active={active}
        >
          {showTooltip ? (
            <RangeHandleTooltip
              innerRef={st => {
                this.tooltip = st
              }}
              orientation={orientation}
            >
              <span>{this.handleFormat(value)}</span>
            </RangeHandleTooltip>
          ) : null}
          <div data-type="label">{handleLabel}</div>
        </RangeHandle>
        {labels ? this.renderLabels(labelItems) : null}
      </RangeWrapper>
    )
  }
}

const RangeWrapper = styled.div`
  position: relative;
  background: transparent;
  touch-action: none;
  ${({ orientation }) =>
    orientation === 'vertical'
      ? 'margin: 20px auto;height: 150px;max-width: 10px;background-color: transparent;'
      : 'height: 4px;border-radius: 10px;'};
`
const RangeLabels = styled.ul`
  position: relative;
`

const RangeLabelItem = styled.li`
  position: absolute;
  font-size: 14px;
  cursor: pointer;
  display: inline-block;
  top: 10px;
  transform: translate3d(-50%, 0, 0);
  ${({ orientation }) =>
    orientation === 'vertical'
      ? `
      position: absolute;
      transform: translate3d(0, -50%, 0);
      &:before {
        content: '';
        width: 10px;
        height: 2px;
        background: black;
        position: absolute;
        left: -14px;
        top: 50%;
        transform: translateY(-50%);
        z-index: -1;
      }`
      : ''};
`

const RangeFill = styled.div`
  display: block;
  transition: all 40ms linear;
  ${({ orientation }) =>
    orientation === 'vertical'
      ? `
    position: absolute;
    width: 100%;
    box-shadow: none;
    bottom: 0;`
      : `    
    height: 100%;
    top: 0;`};
`

const RangeHandle = styled.div`
  border: 10px solid;
  cursor: pointer;
  display: inline-block;
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transform: translate3d(-16px, -17px, 0);
  user-select: none;
  transition: all 40ms linear;
  box-shadow: 0px 6px 14px -2px rgb(146, 173, 175);
  &:active,
  &:hover {
    box-shadow: 0 4px 15px -5px rgb(119, 148, 150);
  }
  ${({ orientation }) =>
    orientation === 'vertical'
      ? `
      position: absolute;
      width: 30px;
      height: 30px;
      border-radius: 30px;
      transform: translate3d(-36%, 50%, 0);
      &:after {
        content: ' ';
        position: absolute;
        width: 30px;
        height: 30px;
        top: -10px;
        left: -10px;
        border-radius: 50%;
        background-color: transparent;
      }`
      : ''};
`

const RangeHandleTooltip = styled.div`
  width: 40px;
  height: 40px;
  text-align: center;
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  font-weight: 500;
  font-size: 14px;
  transition: all 100ms ease-in;
  border-radius: 4px;
  display: inline-block;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  & span {
    margin-top: 12px;
    display: inline-block;
    line-height: 100%;
  }
  &:after {
    content: ' ';
    position: absolute;
    width: 0;
    height: 0;
  }
  ${({ orientation }) =>
    orientation === 'vertical'
      ? `
      top: -55px;
      &:after {
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid rgba(0, 0, 0, 0.8);
        left: 50%;
        bottom: -8px;
        transform: translate3d(-50%, 0, 0);
      }`
      : ''};
`
