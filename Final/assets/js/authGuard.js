import * as dbUser from "./soupabase/user.js";

const isLogin = window.location.pathname.includes("/login");

const { user, error } = await dbUser.getLoggedUser();

if ((error || !user) && !isLogin) {
  console.log("Not logged in");
  window.location.href = "/login";
} else if (user && isLogin) {
  window.location.href = "/menu";
}
