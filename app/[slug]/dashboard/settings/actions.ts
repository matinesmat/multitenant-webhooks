"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData) {
  try {
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();

    if (!fullName || !email) {
      return { success: false, error: "Full name and email are required" };
    }

    const supabase = createServerActionClient({ cookies });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Update user email in auth
    const { error: emailError } = await supabase.auth.updateUser({
      email: email
    });

    if (emailError) {
      return { success: false, error: `Failed to update email: ${emailError.message}` };
    }

    // Update or create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        phone: phone || null,
        bio: bio || null,
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      return { success: false, error: `Failed to update profile: ${profileError.message}` };
    }

    // Update user metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        phone: phone || null
      }
    });

    if (metadataError) {
      console.warn("Failed to update user metadata:", metadataError.message);
      // Don't fail the entire operation for metadata update
    }

    revalidatePath('/dashboard/settings');
    return { success: true, message: "Profile updated successfully!" };
  } catch (error) {
    return { success: false, error: `Error updating profile: ${error}` };
  }
}

export async function updateAvatarAction(formData: FormData) {
  try {
    const avatarFile = formData.get("avatar") as File;
    
    if (!avatarFile) {
      return { success: false, error: "No avatar file provided" };
    }

    const supabase = createServerActionClient({ cookies });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Upload avatar to Supabase Storage
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      return { success: false, error: `Failed to upload avatar: ${uploadError.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile with avatar URL
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      return { success: false, error: `Failed to update profile: ${profileError.message}` };
    }

    revalidatePath('/dashboard/settings');
    return { success: true, message: "Avatar updated successfully!" };
  } catch (error) {
    return { success: false, error: `Error updating avatar: ${error}` };
  }
}

export async function updatePasswordAction(formData: FormData) {
  try {
    const currentPassword = String(formData.get("currentPassword") ?? "").trim();
    const newPassword = String(formData.get("newPassword") ?? "").trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, error: "All password fields are required" };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "New passwords do not match" };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long" };
    }

    const supabase = createServerActionClient({ cookies });

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { success: false, error: `Failed to update password: ${error.message}` };
    }

    revalidatePath('/dashboard/settings');
    return { success: true, message: "Password updated successfully!" };
  } catch (error) {
    return { success: false, error: `Error updating password: ${error}` };
  }
}

