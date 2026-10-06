import { useLoginStore } from 'stores/loginStore';
import { useMenuStore } from 'stores/menuStore';

export default ({ router }) => {
  router.beforeEach(async (to, from, next) => {
    const isLoggedIn = Boolean(useLoginStore().hasToken);

    if (to.meta.requiresAuth && !isLoggedIn)
      return next('/login');

    /** Keep the user out of pages that are not part of their menu. Wait for the menu
     * to be known first, so a forbidden page never renders before the redirect. */
    if (isLoggedIn) {
      const menuStore = useMenuStore();
      await menuStore.ensureLoaded();
      if (!menuStore.isPathAccessible(to.path))
        return next('/');
    }

    next()
  })
}
