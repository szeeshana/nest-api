import { StageEmailReminderEnum } from '../../enum/stage-email-reminder.enum';
import { DefaultSort } from '../../enum/default-sort.enum';

export const EMAIL_TEMPLATE = {
  header: `<!DOCTYPE html>
    <html>

    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
      <title>Whatstocks</title>
      <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,700&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0;">`,
  footer: `</body>
    </html>`,
};
export const TABLES = {
  TENANT: 'tenant',
  MIGRATIONS: 'migrations',
  EMAIL_TEMPLATE: 'email_template',
  PASSWORD_POLICY: 'password_policy',
  PASSWORD_RESET: 'password_reset',
  USER_COMMUNITIES_COMMUNITY: 'user_communities_community',
  LANGUAGE: 'language',
  THEME: 'theme',
  DOMAIN: 'domain',
  COMMUNITY: 'community',
  INVITE: 'invite',
  USER: 'user',
  CIRCLE: 'circle',
  USER_CIRCLES: 'user_circles',
  TAG: 'tag',
  USER_TAGS: 'user_tags',
  SHORTCUT: 'shortcut',
  USER_SHORTCUTS: 'user_shortcuts',
  BOOKMARK: 'bookmark',
  USER_BOOKMARKS: 'user_bookmarks',
  FOLLOWING_CONTENT: 'following_content',
  USER_FOLLOWING_CONTENT: 'user_following_content',
  ENTITY_TYPE: 'entity_type',
  ACTION_TYPE: 'action_type',
  ACTIVITY: 'activity',
  OPPORTUNITY: 'opportunity',
  OPPORTUNITY_TYPE: 'opportunity_type',
  OPPORTUNITY_TYPE_POSTING_EXPERIENCE: 'opportunity_type_posting_experience',
  OPPORTUNITY_TYPE_PERMISSION: 'opportunity_type_permission',
  OPPORTUNITY_ATTACHMENT: 'opportunity_attachment',
  COMMUNITY_SETTING: 'community_setting',
  COMMUNITY_BASE_PERMISSION: 'community_base_permission',
  ROLE: 'role',
  USER_ATTACHMENTS: 'user_attachments',
  TAG_REFERENCE_MAPPING: 'tag_reference_mapping',
  VOTE: 'vote',
  COMMENT_THREAD: 'comment_thread',
  COMMENT_THREAD_PARTICIPANT: 'comment_thread_participant',
  COMMENT: 'comment',
  COMMENT_READ_STATUS: 'comment_read_status',
  COMMENT_ATTACHMENT: 'comment_attachment',
  COMMUNITY_APPEARANCE_SETTING: 'community_appearance_setting',
  CHALLENGE: 'challenge',
  CHALLENGE_PARTICIPANT: 'challenge_participant',
  ENTITY_EXPERIENCE_SETTING: 'entity_experience_setting',
  ROLE_ACTORS: 'role_actors',
  COMMUNITY_WISE_PERMISSION: 'community_wise_permission',
  SHARE: 'share',
  COMMUNITY_ACTION_POINT: 'community_action_point',
  USER_ACTION_POINT: 'user_action_point',
  OPPORTUNITY_USER: 'opportunity_user',
  ENTITY_VISIBILITY_SETTING: 'entity_visibility_setting',
  PRIZE: 'prize',
  PRIZE_CATEGORY: 'prize_category',
  PRIZE_AWARDEE: 'prize_awardee',
  WORKFLOW: 'workflow',
  STAGE: 'stage',
  STAGE_NOTIFICATION_SETTING: 'stage_notification_setting',
  STATUS: 'status',
  INTEGRATION: 'integration',
  MENTION: 'mention',
  CHALLENGE_ATTACHMENT: 'challenge_attachment',
  STAGE_ASSIGNEE_SETTINGS: 'stage_assignee_settings',
  STAGE_ASSIGNMENT_SETTINGS: 'stage_assignment_settings',
  ACTION_ITEM: 'action_item',
  CUSTOM_FIELD: 'custom_field',
  CUSTOM_FIELD_TYPE: 'custom_field_type',
  OPPORTUNITY_TYPE_FIELD: 'opportunity_type_field', // Table removed.
  CUSTOM_FIELD_INTEGRATION: 'custom_field_integration',
  CUSTOM_FIELD_DATA: 'custom_field_data',
  OPPORTUNITY_FIELD_LINKAGE: 'opportunity_field_linkage',
  EVALUATION_TYPE: 'evaluation_type',
  EVALUATION_CRITERIA: 'evaluation_criteria',
  EVALUATION_CRITERIA_INTEGRATION: 'evaluation_criteria_integration',
  OPP_EVALUATION_RESPONSE: 'opp_evaluation_response',
  STAGE_HISTORY: 'stage_history',
  FILTER_OPTION: 'filter_option',
  AUTH_INTEGRATION: 'auth_integration',
  BOOKMARKED_VIEW: 'bookmarked_view',
  DASHBOARD: 'dashboard',
  WIDGET: 'widget',
};

export const BOOLEAN = {
  TRUE: 'true',
  FALSE: 'false',
};

export const USER_TABLE_SELECT =
  'id,created_at,updated_at,is_deleted,updated_by,created_by,first_name,last_name,user_name,role,email,secondary_email,salt,last_login,is_sso,image_url,profile_bio,skills,region,country,zip_code,position,company';

export const DUMMY_DATA_OBJECTS = {
  postIdea: {
    id: '1a73d22e-5b79-4a34-af85-259cbdd3b0f4',
    createdAt: '2019-12-10T10:17:00.458Z',
    updatedAt: '2019-12-10T10:17:00.458Z',
    isDeleted: false,
    updatedBy: null,
    createdBy: null,
    ip: '::1',
    userAgent: 'PostmanRuntime/7.20.1',
    parameter: null,
    entityObjectId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    entityType: {
      id: 'e38f2765-4ed4-4b8d-8d2d-531b015d8cb7',
      createdAt: '2019-12-10T09:47:14.991Z',
      updatedAt: '2019-12-10T09:47:14.991Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      name: 'Idea',
      abbreviation: 'idea',
      entityCode: '001',
    },
    actionType: {
      id: 'e702f13e-a49c-47ed-8f6b-c8ad91bb3d4e',
      createdAt: '2019-12-10T09:05:54.379Z',
      updatedAt: '2019-12-10T09:06:55.894Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      name: 'Post Idea',
      abbreviation: 'post-idea',
    },
    entityObject: {
      title: 'Idea',
      createdAt: '2019-11-28T13:48:21.807Z',
      userId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
      code: '200',
      id: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    },
  },
  postChallenge: {
    id: '1a73d22e-5b79-4a34-af85-259cbdd3b0f4',
    createdAt: '2019-12-10T10:17:00.458Z',
    updatedAt: '2019-12-10T10:17:00.458Z',
    isDeleted: false,
    updatedBy: null,
    createdBy: null,
    ip: '::1',
    userAgent: 'PostmanRuntime/7.20.1',
    parameter: null,
    entityObjectId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    entityType: {
      id: 'e38f2765-4ed4-4b8d-8d2d-531b015d8cb7',
      createdAt: '2019-12-10T09:47:14.991Z',
      updatedAt: '2019-12-10T09:47:14.991Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      name: 'Idea',
      abbreviation: 'idea',
      entityCode: '001',
    },
    actionType: {
      id: 'e702f13e-a49c-47ed-8f6b-c8ad91bb3d4e',
      createdAt: '2019-12-10T09:05:54.379Z',
      updatedAt: '2019-12-10T09:06:55.894Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      name: 'Post Challenge',
      abbreviation: 'post-challenge',
    },
    entityObject: {
      title: 'Challenge',
      createdAt: '2019-11-28T13:48:21.807Z',
      userId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
      code: '200',
      id: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    },
  },
  postInsight: {
    id: '1a73d22e-5b79-4a34-af85-259cbdd3b0f4',
    createdAt: '2019-12-10T10:17:00.458Z',
    updatedAt: '2019-12-10T10:17:00.458Z',
    isDeleted: false,
    updatedBy: null,
    createdBy: null,
    ip: '::1',
    userAgent: 'PostmanRuntime/7.20.1',
    parameter: null,
    entityObjectId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    entityType: {
      id: 'e38f2765-4ed4-4b8d-8d2d-531b015d8cb7',
      createdAt: '2019-12-10T09:47:14.991Z',
      updatedAt: '2019-12-10T09:47:14.991Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      name: 'Idea',
      abbreviation: 'idea',
      entityCode: '001',
    },
    actionType: {
      id: 'e702f13e-a49c-47ed-8f6b-c8ad91bb3d4e',
      createdAt: '2019-12-10T09:05:54.379Z',
      updatedAt: '2019-12-10T09:06:55.894Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      name: 'Post Insight',
      abbreviation: 'post-insight',
    },
    entityObject: {
      title: 'Insight',
      createdAt: '2019-11-28T13:48:21.807Z',
      userId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
      code: '200',
      id: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    },
  },
  comment: {
    id: '1a73d22e-5b79-4a34-af85-259cbdd3b0f4',
    createdAt: '2019-12-10T10:17:00.458Z',
    updatedAt: '2019-12-10T10:17:00.458Z',
    isDeleted: false,
    updatedBy: null,
    createdBy: null,
    ip: '::1',
    userAgent: 'PostmanRuntime/7.20.1',
    parameter: {
      comment: {
        id: '1a73d22e-5b79-4a34-af85-259cbdd3b099',
        body: 'Hello , how are you ?',
        isMentioned: false,
      },
    },
    entityObjectId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    entityType: {
      id: 'e38f2765-4ed4-4b8d-8d2d-531b015d8cb7',
      createdAt: '2019-12-10T09:47:14.991Z',
      updatedAt: '2019-12-10T09:47:14.991Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      name: 'Idea',
      abbreviation: 'idea',
      entityCode: '001',
    },
    actionType: {
      id: 'e702f13e-a49c-47ed-8f6b-c8ad91bb3d4e',
      createdAt: '2019-12-10T09:05:54.379Z',
      updatedAt: '2019-12-10T09:06:55.894Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      name: 'Comment',
      abbreviation: 'comment',
    },
    entityObject: {
      body: 'Idea',
      createdAt: '2019-11-28T13:48:21.807Z',
      userId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
      code: '200',
      id: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    },
  },
  mentioned: {
    id: '1a73d22e-5b79-4a34-af85-259cbdd3b0f4',
    createdAt: '2019-12-10T10:17:00.458Z',
    updatedAt: '2019-12-10T10:17:00.458Z',
    isDeleted: false,
    updatedBy: null,
    createdBy: null,
    ip: '::1',
    userAgent: 'PostmanRuntime/7.20.1',
    parameter: {
      comment: {
        id: '1a73d22e-5b79-4a34-af85-259cbdd3b099',
        body: 'Hello , how are you @Mustafa ?',
        isMentioned: true,
      },
    },
    entityObjectId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    entityType: {
      id: 'e38f2765-4ed4-4b8d-8d2d-531b015d8cb7',
      createdAt: '2019-12-10T09:47:14.991Z',
      updatedAt: '2019-12-10T09:47:14.991Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      name: 'Idea',
      abbreviation: 'idea',
      entityCode: '001',
    },
    actionType: {
      id: 'e702f13e-a49c-47ed-8f6b-c8ad91bb3d4e',
      createdAt: '2019-12-10T09:05:54.379Z',
      updatedAt: '2019-12-10T09:06:55.894Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      name: 'Comment',
      abbreviation: 'comment',
    },
    entityObject: {
      body: 'Idea',
      createdAt: '2019-11-28T13:48:21.807Z',
      userId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
      code: '200',
      id: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    },
  },

  followingInsight: {
    userId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    followingContentId: '56a9b3d7-9d32-4a66-9cdb-96fd9150eb86',
    followingContent: {
      id: '56a9b3d7-9d32-4a66-9cdb-96fd9150eb86',
      createdAt: '2019-12-10T14:06:35.019Z',
      updatedAt: '2019-12-10T14:06:35.019Z',
      isDeleted: false,
      updatedBy: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
      createdBy: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
      displayName: 'shName',
      entityObjectId: 'c552d0ae-2ec8-44bb-b574-a4577f23431c',
      url: 'http:lll.com',
      email: 'a@a.com',
      entityType: {
        id: 'e38f2765-4ed4-4b8d-8d2d-531b015d8cb7',
        createdAt: '2019-12-10T09:47:14.991Z',
        updatedAt: '2019-12-10T09:47:14.991Z',
        isDeleted: false,
        updatedBy: null,
        createdBy: null,
        name: 'Insight',
        abbreviation: 'insight',
        entityCode: '002',
      },
    },
    entityObject: {
      id: 'c552d0ae-2ec8-44bb-b574-a4577f23431c',
      createdAt: '2019-11-26T11:23:28.110Z',
      updatedAt: '2019-11-26T11:23:28.110Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      title: 'My Insight',
    },
  },
  followingChallenge: {
    userId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    followingContentId: '56a9b3d7-9d32-4a66-9cdb-96fd9150eb86',
    followingContent: {
      id: '56a9b3d7-9d32-4a66-9cdb-96fd9150eb86',
      createdAt: '2019-12-10T14:06:35.019Z',
      updatedAt: '2019-12-10T14:06:35.019Z',
      isDeleted: false,
      updatedBy: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
      createdBy: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
      displayName: 'shName',
      entityObjectId: 'c552d0ae-2ec8-44bb-b574-a4577f23431c',
      url: 'http:lll.com',
      email: 'a@a.com',
      entityType: {
        id: 'e38f2765-4ed4-4b8d-8d2d-531b015d8cb7',
        createdAt: '2019-12-10T09:47:14.991Z',
        updatedAt: '2019-12-10T09:47:14.991Z',
        isDeleted: false,
        updatedBy: null,
        createdBy: null,
        name: 'Challenge',
        abbreviation: 'challenge',
        entityCode: '003',
      },
    },
    entityObject: {
      id: 'c552d0ae-2ec8-44bb-b574-a4577f23431c',
      createdAt: '2019-11-26T11:23:28.110Z',
      updatedAt: '2019-11-26T11:23:28.110Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      title: 'My Insight',
    },
  },
  followingOpportunity: {
    userId: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
    followingContentId: '56a9b3d7-9d32-4a66-9cdb-96fd9150eb86',
    followingContent: {
      id: '56a9b3d7-9d32-4a66-9cdb-96fd9150eb86',
      createdAt: '2019-12-10T14:06:35.019Z',
      updatedAt: '2019-12-10T14:06:35.019Z',
      isDeleted: false,
      updatedBy: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
      createdBy: 'b84f54c4-5645-4eff-8567-fa8a3297429b',
      displayName: 'shName',
      entityObjectId: 'c552d0ae-2ec8-44bb-b574-a4577f23431c',
      url: 'http:lll.com',
      email: 'a@a.com',
      entityType: {
        id: 'e38f2765-4ed4-4b8d-8d2d-531b015d8cb7',
        createdAt: '2019-12-10T09:47:14.991Z',
        updatedAt: '2019-12-10T09:47:14.991Z',
        isDeleted: false,
        updatedBy: null,
        createdBy: null,
        name: 'Opportunity',
        abbreviation: 'opportunity',
        entityCode: '002',
      },
    },
    entityObject: {
      id: 'c552d0ae-2ec8-44bb-b574-a4577f23431c',
      createdAt: '2019-11-26T11:23:28.110Z',
      updatedAt: '2019-11-26T11:23:28.110Z',
      isDeleted: false,
      updatedBy: null,
      createdBy: null,
      title: 'My Opportunity',
    },
  },
};

export const USER_AVATAR = {
  size: 100,
  background: 'D3F9F1',
  color: '898989',
  type: 'png',
  mimeType: 'image/png',
  bucketPath: 'attachments/users/',
};

export const TIME_LIMITS = {
  START: '00:00:00',
  END: '23:59:59',
};

export const ACTION_TYPES = {
  COMMENT: 'comment',
  FOLLOW: 'follow',
  POST: 'post',
  UPVOTE: 'upvote',
  EDIT: 'edit',
  MENTION: 'mention',
  BOOKMARK: 'bookmark',
  VIEW: 'view',
  SHARE: 'share',
  ACCEPT_INVITE: 'accept_invite',
  ADD_OWNER: 'add_owner',
  REMOVE_OWNER: 'remove_owner',
  ADD_CONTRIBUTOR: 'add_contributor',
  REMOVE_CONTRIBUTOR: 'remove_contributor',
  ADD_SUBMITTER: 'add_submitter',
  REMOVE_SUBMITTER: 'remove_submitter',
  AWARD_PRIZE: 'award_prize',
  INVITE_USER: 'invite_user',
  FORGOT_PASSWORD: 'forgot_password',
  ADD_WORKFLOW: 'add_workflow',
  CHANGE_WORKFLOW: 'change_workflow',
  CHANGE_STAGE: 'change_stage',
};
export const ENTITY_TYPES = {
  IDEA: 'idea',
  COMMENT: 'comment',
  USER: 'user',
  CHALLENGE: 'challenge',
  OPPORTUNITY_TYPE: 'opportunity_type',
  STAGE: 'stage',
  BOOKMARKED_VIEW: 'bookmarked_view',
};
export const MENTION_TYPES = {
  COMMENT: 'comment',
  OPPORTUNITY_DESCRIPTION: 'opportunity_description',
  CHALLENGE: 'challenge',
};

export const TEST_EMAIL = `<div id="wrapper" style="width: 100%;">
<table border="0" cellpadding="0" cellspacing="0" style="width:100%; font-family:  Open Sans ,
      sans-serif;font-size:16px;margin:0 auto;line-height:21px; padding: 25px;">
  <tbody>
    <tr>
      <td align="left" style="color:#455a64;padding:20px 36px 15px">
        <!-- subject -->
        <!-- <h1 style="line-height:28px;font-size:24px; margin: 0; color: #1ab394;font-weight: 400; font-family:
          Montserrat, sans-serif;">You"ve been invited to<br /> innovate with OSF Trailblazer </h1> -->
      </td>
    </tr>
    <tr>
      <!-- body Text -->
      <td align="left" style="color:#455a64;padding:10px 36px 15px">
        <p style="margin: 0; white-space: pre-wrap;">{{body}}</p>
      </td>
    </tr>
    <tr>
      <!-- featured Image -->
      <td align="left" style="color:#455a64;padding:15px 23px 15px">
        <img src="{{featureImage}}" width="100%" style="display: block;">
      </td>
    </tr>
    <tr>
      <!-- footer Text -->
      <td align="left" style="color:#455a64;padding:20px 36px 15px">
        <p style="margin: 0;  white-space: pre-wrap;">{{footer}}</p>
      </td>
    </tr>
    <tr>
      <td align="left" style="padding:25px 36px 15px; border-top: 1px dashed #cfcfcf;">
        <p style="margin: 0 0 10px; font-size: 14px; color: #707070;">Having trouble accessing <a href="#"
            style="color: #1ab394; text-decoration: underline;">demoTestApp?</a></p>
        <p style="margin: 0; font-size: 12px; color: #707070;">Powered by demoTestApp. 1245 North Water Street,
          Floor 2
          </p>
      </td>
    </tr>
  </tbody>
</table>
</div>`;

export const ACTION_ENTITY_MAPPING = [
  { action: ACTION_TYPES.POST, entity: ENTITY_TYPES.IDEA, points: 3 },
  { action: ACTION_TYPES.VIEW, entity: ENTITY_TYPES.IDEA, points: 1 },
  { action: ACTION_TYPES.UPVOTE, entity: ENTITY_TYPES.IDEA, points: 2 },
  { action: ACTION_TYPES.POST, entity: ENTITY_TYPES.COMMENT, points: 2 },
  { action: ACTION_TYPES.COMMENT, entity: ENTITY_TYPES.COMMENT, points: 5 },
  { action: ACTION_TYPES.UPVOTE, entity: ENTITY_TYPES.COMMENT, points: 5 },
  { action: ACTION_TYPES.ACCEPT_INVITE, entity: ENTITY_TYPES.USER, points: 10 },
];

export const PERMISSIONS_MAP = {
  DENY: 0,
  SCENARIO: 1,
  ALLOW: 2,
};

export const DEMO_IPS = [
  '99.7.203.82', //mil
  '69.88.5.10', //huw
  '64.30.228.118', //flo
  '148.72.83.69', //ar
];

export const USER_ACTION_POINT_FUNCTION_OPTIONS = {
  LOCATION: 'locations',
  GROUPS: 'groups',
};

export const PRIZE_CANDIDATE_TYPE = {
  USER: 'user',
  OPPORTUNITY: 'opportunity',
};

export const STAGE_NOTIFICATION_SETTINGS = {
  SUBMITTERS: 'submitter_and_co_submitters',
  OPPORTUNITY_OWNER: 'opportunity_owner',
  TEAM_MEMBERS: 'team_members',
  FOLLOWERS: 'followers',
  VOTERS: 'voters',
  INDIVIDUALS_GROUPS: 'specific_individuals_or_groups',
};

export const ROLE_ABBREVIATIONS = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  CHALLENGE_ADMIN: 'challenge_admin',
  CHALLENGE_MODERATOR: 'challenge_moderator',
  CHALLENGE_USER: 'challenge_user',
  GROUP_ADMIN: 'group_admin',
  GROUP_MODERATOR: 'group_moderator',
  GROUP_USER: 'group_user',
  OPPORTUNITY_OWNER: 'opportunity_owner',
  OPPORTUNITY_CONTRIBUTOR: 'opportunity_contributor',
  OPPORTUNITY_SUBMITTER: 'opportunity_submitter',
};

export const ACTION_ITEM_ABBREVIATIONS = {
  NO_TOOL: 'no_tool',
  REFINEMENT: 'refinement',
  VOTING: 'voting',
  SCORECARD: 'scorecard',
};

export const STAGE_EMAIL_REMIDER_TO_SECONDS_MAP = {
  [StageEmailReminderEnum.NEVER]: null,
  [StageEmailReminderEnum.EVERY_WEEK]: 604800,
  [StageEmailReminderEnum.EVERY_TWO_WEEK]: 1209600,
  [StageEmailReminderEnum.EVERY_MONTH]: 2592000,
};

export const STAGE_EMAIL_SETTING_TYPE = {
  NOTIFICATION: 'notification',
  ASSIGNEE: 'assignee',
};

export const PERMISSIONS_KEYS = {
  accessSettings: 'accessSettings',
  accessBasicSettings: 'accessBasicSettings',
  accessAppearanceSettings: 'accessAppearanceSettings',
  accessSecuritySettings: 'accessSecuritySettings',
  accessPointsSettings: 'accessPointsSettings',
  accessIntegrations: 'accessIntegrations',
  manageScheduledEmails: 'manageScheduledEmails',
  manageCommunities: 'manageCommunities',
  manageBillingAndPlan: 'manageBillingAndPlan',
  createNewCommunity: 'createNewCommunity',
  addOpportunityType: 'addOpportunityType',
  editOpportunityType: 'editOpportunityType',
  deleteOpportunityType: 'deleteOpportunityType',
  postOpportunity: 'postOpportunity',
  postChallenge: 'postChallenge',
  editChallengeDetails: 'editChallengeDetails',
  editChallengeSettings: 'editChallengeSettings',
  editChallengeTargetting: 'editChallengeTargetting',
  editChallengePhaseWorkflow: 'editChallengePhaseWorkflow',
  managePrize: 'managePrize',
  awardPrize: 'awardPrize',
  viewOpportunity: 'viewOpportunity',
  editOpportunity: 'editOpportunity',
  addFilesToOpportunity: 'addFilesToOpportunity',
  editOpportunitySettings: 'editOpportunitySettings',
  softDeleteOpportunity: 'softDeleteOpportunity',
  changeOpportunityStage: 'changeOpportunityStage',
  changeOpportunityWorkflow: 'changeOpportunityWorkflow',
  addOpportunityOwner: 'addOpportunityOwner',
  removeOpportunityOwner: 'removeOpportunityOwner',
  addOpportunityContributor: 'addOpportunityContributor',
  removeOpportunityContributor: 'removeOpportunityContributor',
  addOpportunitySubmitter: 'addOpportunitySubmitter',
  removeOpportunitySubmitter: 'removeOpportunitySubmitter',
  linkOpportunities: 'linkOpportunities',
  mergeOpportunities: 'mergeOpportunities',
  voteOpportunity: 'voteOpportunity',
  followOpportunity: 'followOpportunity',
  bookmarkOpportunity: 'bookmarkOpportunity',
  shareOpportunity: 'shareOpportunity',
  postComments: 'postComments',
  editComments: 'editComments',
  softDeleteComments: 'softDeleteComments',
  mentionUsers: 'mentionUsers',
  mentionGroups: 'mentionGroups',
  mentionChallengeUsers: 'mentionChallengeUsers',
  mentionAllUsersInChallenge: 'mentionAllUsersInChallenge',
  mentionChallengeGroups: 'mentionChallengeGroups',
  mentionAllGroupsInChallenge: 'mentionAllGroupsInChallenge',
  accessCustomFieldSettings: 'accessCustomFieldSettings',
  createCustomField: 'createCustomField',
  editCustomField: 'editCustomField',
  editCustomFieldOptions: 'editCustomFieldOptions',
  softDeleteCustomField: 'softDeleteCustomField',
  editCustomFieldData: 'editCustomFieldData',
  viewCustomFieldData: 'viewCustomFieldData',
  viewStageSpecificTab: 'viewStageSpecificTab',
  manageOpportunityTypes: 'manageOpportunityTypes',
  manageUserRoles: 'manageUserRoles',
  archiveUser: 'archiveUser',
  manageJumbotron: 'manageJumbotron',
  viewBookmarkedView: 'viewBookmarkedView',
  manageBookmarkedView: 'manageBookmarkedView',
};

export const CUSTOM_FIELD_TYPE_ABBREVIATIONS = {
  COMMUNITY_USER_GROUP: 'community_user_or_group',
  USER_SKILLS_TAGS: 'user_skills_tags',
  SINGLE_LINE_TEXT: 'single_line_text',
  MULTI_LINE_TEXT: 'multi_line_text',
  RICH_TEXT: 'rich_text',
  SINGLE_SELECT: 'single_select',
  MULTI_SELECT: 'multi_select',
  DATEPICKER: 'datepicker',
  PROJECTED_BENEFITS: 'projected_benefits',
  PROJECTED_COSTS: 'projected_costs',
  ACTUAL_BENEFITS: 'actual_benefits',
  ACTUAL_COSTS: 'actual_costs',
  NUMBER: 'number',
  CALCULATED_FIELD: 'calculated_field',
  FILE_UPLOAD: 'file_upload',
  VIDEO_UPLOAD: 'video_upload',
  IMAGE_UPLOAD: 'image_upload',
};

export const REMINDER_FREQUENCY_MAPPING = {
  EVERY_WEEK: '168',
  EVERY_TWO_WEEK: '336',
  EVERY_MONTH: '5040',
};
export const MESSAGES_FOR_ACTION_ITEM_NOTIFICATION = {
  REFINEMENT:
    'Please help us determine whether this idea should be progressed to the steering committee for review to be evaluated for implementation or moved to the parking lot for evaluation at later date. Thanks so much for your help.',
};
export const EVALUATION_TYPE_ABBREVIATIONS = {
  NUMBER: 'numerical_range',
  QUESTION: 'question',
};

export const NORMALIZED_TOTAL_CRITERIA_SCORE = 10;

export const NORMALIZED_TOTAL_ENTITY_SCORE = 100;

export const CHALLENGE_SORTING = {
  [DefaultSort.MOST_VOTES]: { key: 'vote', type: 'DESC' },
  [DefaultSort.NEWEST]: { key: 'opportunity.createdAt', type: 'DESC' },
  [DefaultSort.OLDEST]: { key: 'opportunity.createdAt', type: 'ASC' },
  [DefaultSort.MOST_COMMENTS]: { key: 'comment', type: 'DESC' },
  [DefaultSort.RANDOM]: { key: 'id', type: 'DESC' },
};

export const COMMUNITY_ROLE_LEVELS = {
  [ROLE_ABBREVIATIONS.ADMIN]: 1,
  [ROLE_ABBREVIATIONS.MODERATOR]: 2,
  [ROLE_ABBREVIATIONS.USER]: 3,
};

export const INNO_BOT = {
  name: 'InnoBot',
  email: 'innobot@demoTestApp.com',
};

export const INDEXES = {
  COMMUNITY: 'community',
  OPPORTUNITY: 'opportunity',
  OPPORTUNITY_TYPE: 'opportunity_type',
  CHALLENGE: 'challenge',
  USER: 'user',
  TAG: 'tag',
};
