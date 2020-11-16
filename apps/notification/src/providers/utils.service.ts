export class UtilsService {
  public static getButtonLinkForEmails(url) {
    return `<a href="${url}" style="width: 200px; height: 28px; font-size:16px; line-height:36px; background:#1ab394;text-decoration:none;border-radius:4px;color:#fff;font-weight:700; text-transform: uppercase; padding:10px 20px;display:inline-block;margin-bottom:0;font-weight:normal;text-align:center;vertical-align:middle">Complete task</a>`;
  }
}
