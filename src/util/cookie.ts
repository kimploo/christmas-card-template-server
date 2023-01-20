export default {
  bake: (domain: string, expires: Date) => {
    if (expires) {
      return {
        domain,
        path: '/',
        sameSite: 'none',
        httpOnly: true,
        secure: true,
        expires, // 7일 후 소멸되는 Persistent Cookie        // Expires 옵션이 없는 Session Cookie
      };
    }
    return {
      domain,
      path: '/',
      sameSite: 'none',
      httpOnly: true,
      secure: true,
      // Expires 옵션이 없는 Session Cookie
    };
  },
};
