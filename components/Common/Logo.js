// https://react-svgr.com/playground/
import * as React from 'react'
import Image from 'next/image'

const Logo = (props) => (
  <Image
    width='40'
    height='40'
    viewBox='0 0 100 100'
    style={{
      opacity: 1,
      borderRadius: '.5rem',
    }}
    src='https://upyun.zer0.top/IMG_1360.jpeg'

  >
  </Image>
)

export default Logo
