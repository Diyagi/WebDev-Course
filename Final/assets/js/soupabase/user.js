import { supabase } from "./supaCliente.js";

// Creates a new user.
export async function createUser(data) {
  return await supabase.functions.invoke(`supaUser/users`, {
    body: { ...data },
    method: "POST",
  });
}

// Signs in the user with an email and password.
export async function authUser(email, password) {
  return await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
}

// Ends the Supabase session.
export async function logoutUser() {
  return await supabase.auth.signOut();
}

// Gets the authenticated user and their profile details.
export async function getLoggedUser() {
  // Get the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Error fetching auth user:", authError?.message);

    return {
      user: null,
      error: authError,
    };
  }

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile data:", profileError?.message);

    return {
      user: null,
      error: profileError,
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      username: profile.username,
      fullname: profile.full_name,
      role: profile.user_role,
    },
    error: null,
  };
}

// Fetches the user details by ID.
export async function getUser(userId) {
  return await supabase.functions.invoke(`supaUser/users/${userId}`, {
    method: "GET",
  });
}

// Fetches the list of users.
export async function getUsers() {
  return await supabase.functions.invoke("supaUser/users", { method: "GET" });
}

// Updates the user details.
export async function updateUser(userId, data) {
  return await supabase.functions.invoke(`supaUser/users/${userId}`, {
    body: { ...data },
    method: "PATCH",
  });
}

// Deletes the specified user.
export async function deleteUser(userId) {
  return await supabase.functions.invoke(`supaUser/users/${userId}`, {
    method: "DELETE",
  });
}

// Checks whether the username is available.
export async function checkUsernameAva(username) {
  return await supabase.functions.invoke(
    `checkAvailability/username?username=${encodeURIComponent(username)}`,
    { method: "GET" },
  );
}

// Checks whether the email is available.
export async function checkEmailAva(email) {
  return await supabase.functions.invoke(
    `checkAvailability/email?email=${encodeURIComponent(email)}`,
    { method: "GET" },
  );
}
