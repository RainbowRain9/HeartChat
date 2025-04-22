# 数据库集合结构模板

## 集合设计模板

### 集合名称：`collection_name`

**描述**：简要描述集合的用途和包含的数据类型。

**字段结构**：

| 字段名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| _id | String | 是 | 文档ID，自动生成 | "doc123456" |
| name | String | 是 | 名称 | "示例名称" |
| description | String | 否 | 描述 | "这是一个示例描述" |
| type | Number | 是 | 类型（0:类型A, 1:类型B） | 0 |
| tags | Array | 否 | 标签列表 | ["标签1", "标签2"] |
| status | Number | 是 | 状态（0:正常, 1:禁用, 2:删除） | 0 |
| config | Object | 否 | 配置信息 | { "key": "value" } |
| parentId | String | 否 | 父级ID | "parent123" |
| order | Number | 否 | 排序序号 | 1 |
| createTime | Date | 是 | 创建时间 | "2023-01-01T12:00:00Z" |
| updateTime | Date | 是 | 更新时间 | "2023-01-10T08:30:00Z" |
| creatorId | String | 是 | 创建者ID | "user123" |

**索引**：

| 索引名 | 字段 | 类型 | 描述 |
|-------|------|------|------|
| primary | _id | 主键 | 文档主键索引 |
| name | name | 普通 | 按名称查询 |
| type_status | type, status | 复合 | 按类型和状态查询 |
| createTime | createTime | 普通 | 按创建时间排序 |
| parentId | parentId | 普通 | 按父级ID查询 |
| creatorId | creatorId | 普通 | 按创建者查询 |

**权限设置**：

- 读取权限：所有用户可读
- 写入权限：仅创建者和管理员可写
- 更新权限：仅创建者和管理员可更新
- 删除权限：仅创建者和管理员可删除

**示例文档**：

```json
{
  "_id": "doc123456",
  "name": "示例名称",
  "description": "这是一个示例描述",
  "type": 0,
  "tags": ["标签1", "标签2"],
  "status": 0,
  "config": {
    "key1": "value1",
    "key2": "value2"
  },
  "parentId": "parent123",
  "order": 1,
  "createTime": "2023-01-01T12:00:00Z",
  "updateTime": "2023-01-10T08:30:00Z",
  "creatorId": "user123"
}
```

## 关系设计模板

### 一对一关系

**主集合**：`users`
**关联集合**：`user_profiles`

**关系字段**：
- `user_profiles` 集合中的 `userId` 字段关联到 `users` 集合的 `_id` 字段

**查询示例**：

```javascript
// 获取用户及其资料
async function getUserWithProfile(userId) {
  const db = cloud.database();
  
  // 获取用户信息
  const user = await db.collection('users').doc(userId).get();
  
  if (!user.data) {
    throw new Error('User not found');
  }
  
  // 获取用户资料
  const profile = await db.collection('user_profiles')
    .where({ userId: userId })
    .get();
  
  return {
    ...user.data,
    profile: profile.data[0] || null
  };
}
```

### 一对多关系

**主集合**：`departments`
**关联集合**：`employees`

**关系字段**：
- `employees` 集合中的 `departmentId` 字段关联到 `departments` 集合的 `_id` 字段

**查询示例**：

```javascript
// 获取部门及其员工
async function getDepartmentWithEmployees(departmentId) {
  const db = cloud.database();
  
  // 获取部门信息
  const department = await db.collection('departments').doc(departmentId).get();
  
  if (!department.data) {
    throw new Error('Department not found');
  }
  
  // 获取部门员工
  const employees = await db.collection('employees')
    .where({ departmentId: departmentId })
    .get();
  
  return {
    ...department.data,
    employees: employees.data || []
  };
}
```

### 多对多关系

**主集合**：`courses`
**关联集合**：`students`
**中间集合**：`course_enrollments`

**关系字段**：
- `course_enrollments` 集合中的 `courseId` 字段关联到 `courses` 集合的 `_id` 字段
- `course_enrollments` 集合中的 `studentId` 字段关联到 `students` 集合的 `_id` 字段

**查询示例**：

```javascript
// 获取课程及其学生
async function getCourseWithStudents(courseId) {
  const db = cloud.database();
  
  // 获取课程信息
  const course = await db.collection('courses').doc(courseId).get();
  
  if (!course.data) {
    throw new Error('Course not found');
  }
  
  // 获取课程注册信息
  const enrollments = await db.collection('course_enrollments')
    .where({ courseId: courseId })
    .get();
  
  if (enrollments.data.length === 0) {
    return {
      ...course.data,
      students: []
    };
  }
  
  // 获取学生ID列表
  const studentIds = enrollments.data.map(e => e.studentId);
  
  // 获取学生信息
  const students = await db.collection('students')
    .where({
      _id: db.command.in(studentIds)
    })
    .get();
  
  return {
    ...course.data,
    students: students.data || []
  };
}
```

## 嵌套文档模板

### 集合名称：`orders`

**描述**：订单集合，包含嵌套的商品项目和客户信息。

**字段结构**：

| 字段名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| _id | String | 是 | 订单ID | "order123" |
| orderNumber | String | 是 | 订单编号 | "ORD20230101001" |
| status | Number | 是 | 订单状态 | 0 |
| totalAmount | Number | 是 | 订单总金额 | 99.99 |
| items | Array | 是 | 订单商品项目 | [见下方] |
| customer | Object | 是 | 客户信息 | [见下方] |
| paymentInfo | Object | 否 | 支付信息 | [见下方] |
| createTime | Date | 是 | 创建时间 | "2023-01-01T12:00:00Z" |
| updateTime | Date | 是 | 更新时间 | "2023-01-10T08:30:00Z" |

**嵌套结构 - items**：

| 字段名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| productId | String | 是 | 商品ID | "prod123" |
| name | String | 是 | 商品名称 | "示例商品" |
| price | Number | 是 | 商品单价 | 19.99 |
| quantity | Number | 是 | 购买数量 | 2 |
| subtotal | Number | 是 | 小计金额 | 39.98 |

**嵌套结构 - customer**：

| 字段名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| userId | String | 是 | 用户ID | "user123" |
| name | String | 是 | 客户姓名 | "张三" |
| phone | String | 是 | 联系电话 | "13800138000" |
| address | Object | 是 | 收货地址 | [见下方] |

**嵌套结构 - customer.address**：

| 字段名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| province | String | 是 | 省份 | "广东省" |
| city | String | 是 | 城市 | "深圳市" |
| district | String | 是 | 区县 | "南山区" |
| detail | String | 是 | 详细地址 | "科技园路1号" |
| postalCode | String | 否 | 邮政编码 | "518000" |

**嵌套结构 - paymentInfo**：

| 字段名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| method | String | 是 | 支付方式 | "wechat" |
| transactionId | String | 否 | 交易ID | "wx123456789" |
| status | Number | 是 | 支付状态 | 1 |
| paidTime | Date | 否 | 支付时间 | "2023-01-01T12:30:00Z" |

**索引**：

| 索引名 | 字段 | 类型 | 描述 |
|-------|------|------|------|
| primary | _id | 主键 | 订单主键索引 |
| orderNumber | orderNumber | 唯一 | 订单编号唯一索引 |
| customer.userId | customer.userId | 普通 | 按客户ID查询 |
| status_createTime | status, createTime | 复合 | 按状态和创建时间查询 |

**示例文档**：

```json
{
  "_id": "order123",
  "orderNumber": "ORD20230101001",
  "status": 0,
  "totalAmount": 99.99,
  "items": [
    {
      "productId": "prod123",
      "name": "示例商品1",
      "price": 19.99,
      "quantity": 2,
      "subtotal": 39.98
    },
    {
      "productId": "prod456",
      "name": "示例商品2",
      "price": 29.99,
      "quantity": 2,
      "subtotal": 59.98
    }
  ],
  "customer": {
    "userId": "user123",
    "name": "张三",
    "phone": "13800138000",
    "address": {
      "province": "广东省",
      "city": "深圳市",
      "district": "南山区",
      "detail": "科技园路1号",
      "postalCode": "518000"
    }
  },
  "paymentInfo": {
    "method": "wechat",
    "transactionId": "wx123456789",
    "status": 1,
    "paidTime": "2023-01-01T12:30:00Z"
  },
  "createTime": "2023-01-01T12:00:00Z",
  "updateTime": "2023-01-01T12:30:00Z"
}
```

## 使用说明

1. 根据实际业务需求调整集合名称、字段名称和类型
2. 添加必要的字段和索引，删除不需要的字段
3. 根据数据访问模式优化索引设计
4. 考虑数据量和查询频率，决定是否使用嵌套文档或关联集合
5. 为所有集合添加 createTime 和 updateTime 字段，便于数据管理和审计
6. 使用合适的字段类型，如 String、Number、Boolean、Date、Object、Array
7. 为枚举类型的字段添加注释，说明各个值的含义
8. 设计合理的权限控制，确保数据安全

## 数据库操作示例

### 创建文档

```javascript
async function createDocument(data) {
  const db = cloud.database();
  
  // 添加创建时间和更新时间
  const now = db.serverDate();
  const documentData = {
    ...data,
    createTime: now,
    updateTime: now
  };
  
  const result = await db.collection('collection_name').add({
    data: documentData
  });
  
  return result._id;
}
```

### 查询文档

```javascript
async function queryDocuments(conditions, options = {}) {
  const db = cloud.database();
  const { page = 1, pageSize = 10, orderBy = 'createTime', order = 'desc' } = options;
  
  // 构建查询
  let query = db.collection('collection_name');
  
  // 添加查询条件
  if (conditions) {
    query = query.where(conditions);
  }
  
  // 添加排序
  query = query.orderBy(orderBy, order);
  
  // 添加分页
  query = query.skip((page - 1) * pageSize).limit(pageSize);
  
  // 执行查询
  const result = await query.get();
  
  return result.data;
}
```

### 更新文档

```javascript
async function updateDocument(id, data) {
  const db = cloud.database();
  
  // 添加更新时间
  const updateData = {
    ...data,
    updateTime: db.serverDate()
  };
  
  const result = await db.collection('collection_name').doc(id).update({
    data: updateData
  });
  
  return result.stats.updated > 0;
}
```

### 删除文档

```javascript
async function deleteDocument(id) {
  const db = cloud.database();
  
  const result = await db.collection('collection_name').doc(id).remove();
  
  return result.stats.removed > 0;
}
```

### 聚合查询

```javascript
async function aggregateDocuments(groupField) {
  const db = cloud.database();
  const $ = db.command.aggregate;
  
  const result = await db.collection('collection_name')
    .aggregate()
    .match({
      status: 0 // 只统计状态正常的文档
    })
    .group({
      _id: `$${groupField}`,
      count: $.sum(1),
      totalAmount: $.sum('$amount')
    })
    .end();
  
  return result.list;
}
```
