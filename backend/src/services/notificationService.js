const admin = require('firebase-admin');
const pool = require('../config/database');

/**
 * Notification Service
 * Firebase Cloud Messaging (FCM) ile push notification gönderir
 */
class NotificationService {
  /**
   * Kullanıcıya bildirim gönderir
   * @param {string} userId - Firebase UID
   * @param {Object} notification - { title, body }
   * @param {Object} data - Ek data (opsiyonel)
   * @param {Object} options - { priority: 'high', sound: 'default' } (opsiyonel)
   */
  static async sendToUser(userId, notification, data = {}, options = {}) {
    if (!admin.apps.length) {
      console.warn('⚠️ Firebase Admin SDK yapılandırılmamış. Bildirim gönderilemedi.');
      return { success: false, error: 'Firebase Admin SDK yapılandırılmamış' };
    }

    try {
      // Kullanıcının tüm FCM token'larını al
      const tokensResult = await pool.query(
        'SELECT fcm_token FROM user_fcm_tokens WHERE user_id = $1',
        [userId]
      );

      if (tokensResult.rows.length === 0) {
        return { success: false, error: 'Kullanıcının FCM token\'ı bulunamadı' };
      }

      const tokens = tokensResult.rows.map(row => row.fcm_token);

      // FCM mesajı oluştur
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: options.priority || 'high',
          notification: {
            sound: options.sound || 'default',
            channelId: '1ndirim_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              badge: 1,
            },
          },
        },
      };

      // Bildirim gönder
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...message,
      });

      // Başarısız token'ları temizle
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.warn(`❌ Token gönderilemedi: ${resp.error?.message}`);
          }
        });

        if (failedTokens.length > 0) {
          await pool.query(
            'DELETE FROM user_fcm_tokens WHERE fcm_token = ANY($1)',
            [failedTokens]
          );
          console.log(`🗑️ ${failedTokens.length} geçersiz token silindi`);
        }
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('❌ Bildirim gönderme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Birden fazla kullanıcıya bildirim gönderir
   * @param {string[]} userIds - Firebase UID array
   * @param {Object} notification - { title, body }
   * @param {Object} data - Ek data (opsiyonel)
   */
  static async sendToUsers(userIds, notification, data = {}) {
    if (!admin.apps.length) {
      console.warn('⚠️ Firebase Admin SDK yapılandırılmamış. Bildirim gönderilemedi.');
      return { success: false, error: 'Firebase Admin SDK yapılandırılmamış' };
    }

    try {
      // Tüm kullanıcıların FCM token'larını al
      const tokensResult = await pool.query(
        'SELECT fcm_token FROM user_fcm_tokens WHERE user_id = ANY($1)',
        [userIds]
      );

      if (tokensResult.rows.length === 0) {
        return { success: false, error: 'Hiçbir kullanıcının FCM token\'ı bulunamadı' };
      }

      const tokens = tokensResult.rows.map(row => row.fcm_token);

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: '1ndirim_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...message,
      });

      // Başarısız token'ları temizle
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });

        if (failedTokens.length > 0) {
          await pool.query(
            'DELETE FROM user_fcm_tokens WHERE fcm_token = ANY($1)',
            [failedTokens]
          );
        }
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('❌ Toplu bildirim gönderme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Kampanya bildirimi gönderir
   * @param {string} userId - Firebase UID
   * @param {Object} campaign - Kampanya objesi
   */
  static async sendCampaignNotification(userId, campaign) {
    return await this.sendToUser(
      userId,
      {
        title: 'Yeni Kampanya: ' + campaign.title,
        body: campaign.description || campaign.title,
      },
      {
        type: 'campaign',
        campaignId: campaign.id,
        sourceName: campaign.source_name || '',
      }
    );
  }

  /**
   * Favori kampanya hatırlatıcısı gönderir
   * @param {string} userId - Firebase UID
   * @param {Object} campaign - Kampanya objesi
   */
  static async sendFavoriteReminder(userId, campaign) {
    const expiresAt = new Date(campaign.expires_at);
    const now = new Date();
    const hoursLeft = Math.floor((expiresAt - now) / (1000 * 60 * 60));

    return await this.sendToUser(
      userId,
      {
        title: '⏰ Kampanya Yakında Bitiyor',
        body: `${campaign.title} - ${hoursLeft} saat kaldı!`,
      },
      {
        type: 'favorite_reminder',
        campaignId: campaign.id,
        hoursLeft: hoursLeft.toString(),
      }
    );
  }
}

module.exports = NotificationService;
