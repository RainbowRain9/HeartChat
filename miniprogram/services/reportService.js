/**
 * 每日心情报告服务
 */

/**
 * 获取用户每日报告
 * @param {string} date 日期字符串 (YYYY-MM-DD)
 * @param {boolean} forceRegenerate 是否强制重新生成
 * @returns {Promise<object>} 报告数据
 */
async function getDailyReport(date, forceRegenerate = false) {
    try {
        // 验证日期
        const reportDate = date ? new Date(date) : new Date();

        // 调用云函数
        const { result } = await wx.cloud.callFunction({
            name: 'analysis',
            data: {
                type: 'daily_report',
                date: reportDate,
                forceRegenerate
            }
        });

        if (!result.success) {
            throw new Error(result.error || '获取报告失败');
        }

        return {
            success: true,
            report: result.report,
            isNew: result.isNew
        };
    } catch (error) {
        console.error('获取每日报告失败:', error);
        return {
            success: false,
            error: error.message || '获取报告失败'
        };
    }
}

/**
 * 获取用户报告列表
 * @param {number} limit 限制数量
 * @param {number} skip 跳过数量
 * @returns {Promise<object>} 报告列表
 */
async function getReportList(limit = 10, skip = 0) {
    try {
        // 调用云函数
        const { result } = await wx.cloud.callFunction({
            name: 'user',
            data: {
                action: 'getReportList',
                limit,
                skip
            }
        });

        if (!result.success) {
            throw new Error(result.error || '获取报告列表失败');
        }

        return {
            success: true,
            reports: result.reports,
            total: result.total
        };
    } catch (error) {
        console.error('获取报告列表失败:', error);
        return {
            success: false,
            error: error.message || '获取报告列表失败'
        };
    }
}

/**
 * 标记报告为已读
 * @param {string} reportId 报告ID
 * @returns {Promise<object>} 操作结果
 */
async function markReportAsRead(reportId) {
    try {
        // 调用云函数
        const { result } = await wx.cloud.callFunction({
            name: 'user',
            data: {
                action: 'markReportAsRead',
                reportId
            }
        });

        if (!result.success) {
            throw new Error(result.error || '标记报告失败');
        }

        return {
            success: true
        };
    } catch (error) {
        console.error('标记报告为已读失败:', error);
        return {
            success: false,
            error: error.message || '标记报告失败'
        };
    }
}

/**
 * 获取用户兴趣数据
 * @returns {Promise<object>} 兴趣数据
 */
async function getUserInterests() {
    try {
        // 调用云函数
        const { result } = await wx.cloud.callFunction({
            name: 'user',
            data: {
                action: 'getUserInterests'
            }
        });

        if (!result.success) {
            throw new Error(result.error || '获取兴趣数据失败');
        }

        return {
            success: true,
            interests: result.interests
        };
    } catch (error) {
        console.error('获取用户兴趣数据失败:', error);
        return {
            success: false,
            error: error.message || '获取兴趣数据失败'
        };
    }
}

// 导出服务
module.exports = {
    getDailyReport,
    getReportList,
    markReportAsRead,
    getUserInterests
};