export interface SendOtpEmailParams {
    to: string;
    otp: string;
    fullName?: string;
    type?: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET';
}
export declare function sendOtpEmail(params: SendOtpEmailParams): Promise<boolean>;
declare const _default: {
    sendOtpEmail: typeof sendOtpEmail;
};
export default _default;
