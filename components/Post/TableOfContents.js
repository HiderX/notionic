import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { getPageTableOfContents } from 'notion-utils'
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/outline'
import BLOG from '@/blog.config'

export default function TableOfContents ({ blockMap, frontMatter, pageTitle }) {
  const [expandedNodeIds, setExpandedNodeIds] = useState({})

  let collectionId, page
  if (pageTitle) {
    collectionId = Object.keys(blockMap.block)[0]
    page = blockMap.block[collectionId].value
  } else {
    collectionId = Object.keys(blockMap.collection)[0]
    page = Object.values(blockMap.block).find(block => block.value.parent_id === collectionId).value
  }
  const nodes = getPageTableOfContents(page, blockMap)

  // 如果没有目录节点，返回空
  if (!nodes.length) return null

  // 初始化每个一级标题是否展开的状态
  useEffect(() => {
    const initialExpandedState = {}
    nodes.forEach(node => {
      if (node.type === 'header') {
        initialExpandedState[node.id] = false // 初始状态下折叠子标题
      }
    })
    setExpandedNodeIds(initialExpandedState)
  }, [nodes])

  /**
   * 滚动到目标元素
   * @param {string} id - The ID of target heading block (could be in UUID format)
   */
  function scrollTo (id) {
    id = id.replaceAll('-', '')
    const target = document.querySelector(`.notion-block-${id}`)
    if (!target) return
    // `65` is the height of expanded nav
    const top = document.documentElement.scrollTop + target.getBoundingClientRect().top - 65
    document.documentElement.scrollTo({
      top,
      behavior: 'smooth'
    })
  }

  // 监听滚动事件，检测页面滚动到哪个一级标题并展开其子标题
  useEffect(() => {
    const handleScroll = () => {
      const offset = 80 // 偏移量，确保滚动到标题时触发
      const currentScroll = window.scrollY

      // 检查每个一级标题的位置
      nodes.forEach(node => {
        if (node.type === 'header') {
          const headingElement = document.querySelector(`.notion-block-${node.id.replaceAll('-', '')}`)
          if (headingElement) {
            const rect = headingElement.getBoundingClientRect()
            if (rect.top < offset && rect.bottom > offset) {
              // 当前滚动到了该一级标题，展开它的子标题
              setExpandedNodeIds(prevState => ({
                ...prevState,
                [node.id]: true
              }))
            } else {
              // 没有滚动到该标题，折叠它的子标题
              setExpandedNodeIds(prevState => ({
                ...prevState,
                [node.id]: false
              }))
            }
          }
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [nodes])

  return (
    <div
      className='hidden xl:block xl:fixed ml-4 text-sm text-gray-500 dark:text-gray-400 whitespace'
    >
      {pageTitle && (
        <Link
          passHref
          href={`${BLOG.path}/${frontMatter.slug}`}
          scroll={false}
          className='block -ml-6 mb-2 p-2 hover:bg-gray-200 hover:dark:bg-gray-700 rounded-lg'
        >
          <ChevronLeftIcon className='inline-block mb-1 h-5 w-5' />
          <span className='ml-1'>{frontMatter.title}</span>
        </Link>
      )}
      {nodes.map(node => (
        <div key={node.id} className='px-2 hover:bg-gray-200 hover:dark:bg-gray-700 rounded-lg'>
          <a
            data-target-id={node.id}
            className='block py-1 cursor-pointer'
            onClick={() => scrollTo(node.id)}
          >
            {node.text}
          </a>
          {/* 如果是一级标题并且已经展开，则渲染其子标题 */}
          {node.type === 'header' && expandedNodeIds[node.id] && (
            <div className='ml-4'>
              {nodes
                .filter(subNode => subNode.parentId === node.id)
                .map(subNode => (
                  <div key={subNode.id} className='px-2 hover:bg-gray-200 hover:dark:bg-gray-700 rounded-lg'>
                    <a
                      data-target-id={subNode.id}
                      className='block py-1 cursor-pointer'
                      onClick={() => scrollTo(subNode.id)}
                    >
                      {subNode.text}
                    </a>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

TableOfContents.propTypes = {
  blockMap: PropTypes.object.isRequired,
  frontMatter: PropTypes.object.isRequired,
  pageTitle: PropTypes.string
}