/**
 * Lambda 函数 - 用户管理 API
 *
 * 这个文件展示了如何在 Lambda 中定义 RESTful API 接口
 *
 * 重要概念：
 * 1. Lambda 函数通过 event 对象接收 API Gateway 的请求
 * 2. event.httpMethod 表示 HTTP 方法（GET, POST, DELETE 等）
 * 3. event.path 表示请求路径
 * 4. event.pathParameters 包含路径参数（如 /users/{id} 中的 id）
 * 5. event.body 包含请求体（POST/PUT 请求的数据）
 *
 * 用户数据模型 (支持 OAuth2):
 * {
 *   id: string (UUID, 主键)
 *   providerUserId: string (OAuth Provider 用户唯一标识, GSI)
 *   name: string
 *   email: string
 *   avatar?: string
 *   createdAt: string (ISO timestamp)
 *   updatedAt: string (ISO timestamp)
 * }
 */

const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')

// 初始化 DynamoDB 客户端
const dynamoDB = new AWS.DynamoDB.DocumentClient()

// 从环境变量获取表名（Amplify 会自动设置）
const TABLE_NAME = process.env.STORAGE_USERSTABLE_NAME || 'Users-dev'

// GSI 名称 - 用于按 providerUserId 查询
const PROVIDER_INDEX = 'providerUserId-index'

/**
 * Lambda 主处理函数
 *
 * @param {Object} event - API Gateway 事件对象
 * @param {Object} context - Lambda 上下文对象
 * @returns {Object} API Gateway 响应对象
 */
exports.handler = async (event, context) => {
  console.log('收到请求:', JSON.stringify(event, null, 2))

  // 设置 CORS 响应头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  try {
    // ========================================
    // 路由处理：根据 HTTP 方法和路径分发请求
    // ========================================

    const method = event.httpMethod
    const path = event.path

    // OPTIONS 请求（CORS 预检）
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'OK' })
      }
    }

    // GET /users - 获取所有用户
    if (method === 'GET' && path === '/users') {
      return await getAllUsers(headers)
    }

    // POST /users - 创建新用户
    if (method === 'POST' && path === '/users') {
      const body = JSON.parse(event.body || '{}')
      return await createUser(body, headers)
    }

    // GET /users/by-provider/{providerUserId} - 通过 OAuth Provider ID 获取用户
    if (method === 'GET' && path.startsWith('/users/by-provider/')) {
      const providerUserId = decodeURIComponent(path.replace('/users/by-provider/', ''))
      return await getUserByProviderId(providerUserId, headers)
    }

    // GET /users/{id} - 获取单个用户
    if (method === 'GET' && event.pathParameters && event.pathParameters.id) {
      const userId = event.pathParameters.id
      return await getUserById(userId, headers)
    }

    // DELETE /users/{id} - 删除用户
    if (method === 'DELETE' && event.pathParameters && event.pathParameters.id) {
      const userId = event.pathParameters.id
      return await deleteUser(userId, headers)
    }

    // 未匹配的路由
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: '接口不存在',
        message: `未找到 ${method} ${path}`
      })
    }

  } catch (error) {
    console.error('处理请求时出错:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '服务器内部错误',
        message: error.message
      })
    }
  }
}

// ========================================
// API 接口实现函数
// ========================================

/**
 * 获取所有用户
 *
 * API: GET /users
 * 返回：用户列表数组
 */
async function getAllUsers(headers) {
  console.log('执行: 获取所有用户')

  const params = {
    TableName: TABLE_NAME
  }

  const result = await dynamoDB.scan(params).promise()

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Items || [])
  }
}

/**
 * 创建新用户
 *
 * API: POST /users
 * 请求体: { providerUserId?: string, name: string, email: string, avatar?: string }
 * 返回：创建的用户对象
 *
 * 支持两种模式:
 * 1. OAuth 用户: 提供 providerUserId
 * 2. 传统用户: 仅提供 name 和 email (向后兼容)
 */
async function createUser(body, headers) {
  console.log('执行: 创建新用户', body)

  // 验证输入
  if (!body.name) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: '缺少必填字段',
        message: '请提供 name'
      })
    }
  }

  const now = new Date().toISOString()

  // 创建用户对象
  const user = {
    id: uuidv4(), // 生成唯一 ID
    name: body.name,
    email: body.email || '',
    createdAt: now,
    updatedAt: now
  }

  // OAuth 用户字段
  if (body.providerUserId) {
    user.providerUserId = body.providerUserId
  }
  if (body.avatar) {
    user.avatar = body.avatar
  }

  // 写入 DynamoDB
  const params = {
    TableName: TABLE_NAME,
    Item: user
  }

  await dynamoDB.put(params).promise()

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify(user)
  }
}

/**
 * 通过 OAuth Provider ID 获取用户
 *
 * API: GET /users/by-provider/{providerUserId}
 * 路径参数: providerUserId - OAuth Provider 用户唯一标识
 * 返回：用户对象 或 404
 */
async function getUserByProviderId(providerUserId, headers) {
  console.log('执行: 通过 Provider ID 获取用户', providerUserId)

  if (!providerUserId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: '缺少参数',
        message: '请提供 providerUserId'
      })
    }
  }

  // 使用 GSI 查询 (如果 GSI 不存在，回退到 scan)
  try {
    // 尝试使用 GSI
    const queryParams = {
      TableName: TABLE_NAME,
      IndexName: PROVIDER_INDEX,
      KeyConditionExpression: 'providerUserId = :pid',
      ExpressionAttributeValues: {
        ':pid': providerUserId
      }
    }

    const result = await dynamoDB.query(queryParams).promise()

    if (result.Items && result.Items.length > 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Items[0])
      }
    }
  } catch (err) {
    // GSI 可能不存在，回退到 scan
    console.log('GSI query failed, falling back to scan:', err.message)

    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: 'providerUserId = :pid',
      ExpressionAttributeValues: {
        ':pid': providerUserId
      }
    }

    const result = await dynamoDB.scan(scanParams).promise()

    if (result.Items && result.Items.length > 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Items[0])
      }
    }
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({
      error: '用户不存在',
      message: `未找到 Provider ID 为 ${providerUserId} 的用户`
    })
  }
}

/**
 * 根据 ID 获取单个用户
 *
 * API: GET /users/{id}
 * 路径参数: id - 用户 ID
 * 返回：用户对象
 */
async function getUserById(userId, headers) {
  console.log('执行: 获取用户', userId)

  const params = {
    TableName: TABLE_NAME,
    Key: {
      id: userId
    }
  }

  const result = await dynamoDB.get(params).promise()

  if (!result.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: '用户不存在',
        message: `未找到 ID 为 ${userId} 的用户`
      })
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Item)
  }
}

/**
 * 删除用户
 *
 * API: DELETE /users/{id}
 * 路径参数: id - 用户 ID
 * 返回：成功消息
 */
async function deleteUser(userId, headers) {
  console.log('执行: 删除用户', userId)

  const params = {
    TableName: TABLE_NAME,
    Key: {
      id: userId
    }
  }

  await dynamoDB.delete(params).promise()

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: '用户已删除',
      userId
    })
  }
}
