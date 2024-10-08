import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { getPageTableOfContents } from 'notion-utils'
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/outline'
import BLOG from '@/blog.config'

export default function TableOfContents ({ blockMap, frontMatter, pageTitle }) {
  const [expandedNodeIds, setExpandedNodeIds] = useState({})
  const [nodes, setNodes] = useState([])

  let collectionId, page
  if (pageTitle) {
    collectionId = Object.keys(blockMap.block)[0]
    page = blockMap.block[collectionId].value
  } else {
    collectionId = Object.keys(blockMap.collection)[0]
    page = Object.values(blockMap.block).find(block => block.value.parent_id === collectionId).value
  }

  useEffect(() => {
    const nodes = getPageTableOfContents(page, blockMap)
    setNodes(nodes)

    // 初始化每个一级标题是否展开的状态
    const initialExpandedState = {}
    nodes.forEach(node => {
      if (node.type === 'header') {
        initialExpandedState[node.id] = false // 初始状态下折叠子标题
      }
    })
    setExpandedNodeIds(initialExpandedState)
  }, [page, blockMap])

  // 滚动监听的 useEffect 外部，始终执行
  useEffect(() => {
    const handleScroll = () => {
      const offset = 80
      const currentScroll = window.scrollY

      nodes.forEach(node => {
        if (node.type === 'header') {
          const headingElement = document.querySelector(`.notion-block-${node.id.replaceAll('-', '')}`)
          if (headingElement) {
            const rect = headingElement.getBoundingClientRect()
            if (rect.top < offset && rect.bottom > offset) {
              setExpandedNodeIds(prevState => ({
                ...prevState,
                [node.id]: true
              }))
            } else {
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

  // 如果没有目录节点，返回空
  if (!nodes.length) return null

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