// src/Components/CreateProfile.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function CreateProfile() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEditingExistingProfile, setIsEditingExistingProfile] = useState(false);

    // useEffect to fetch and pre-fill existing profile data
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!currentUser) {
                // If no current user, clear form and ensure no editing state
                setIsEditingExistingProfile(false);
                setUsername('');
                setBio('');
                setProfileImageUrl('');
                // The main return block below handles redirection for non-logged-in users.
                return;
            }

            const userDocRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
                console.log("Firestore doc data:", docSnap.data());
                const data = docSnap.data(); // Get the data from the document snapshot

                // Pre-fill the individual state variables with existing data
                setUsername(data.username || currentUser.displayName || currentUser.email.split('@')[0]);
                setBio(data.bio || ''); // Use existing bio, or empty string if null/undefined
                setProfileImageUrl(data.photoURL || currentUser.photoURL || ''); // Use existing photoURL, fallback to Auth photoURL
                setIsEditingExistingProfile(true); // User document exists, so we are editing
            } else {
                console.log("Firestore doc does NOT exist for this user.");
                // Initialize with values from Firebase Auth if no Firestore document exists yet
                setUsername(currentUser.displayName || currentUser.email.split('@')[0]);
                setBio(''); // Start with empty bio
                setProfileImageUrl(currentUser.photoURL || ''); // Use Auth photoURL as initial image
                setIsEditingExistingProfile(false); // No user document, so we are creating
            }
        };

        fetchUserProfile();
    }, [currentUser]); // Re-run effect when currentUser changes

    // Cloudinary Upload Widget Handler
    const handleImageUpload = () => {
        if (!window.cloudinary) {
            setError('Cloudinary script not loaded. Please check your index.html.');
            return;
        }

        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
                uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
                sources: ['local', 'url', 'camera'],
                folder: 'trekmate_profile_pictures',
                clientAllowedFormats: ["png", "gif", "jpeg", "jpg"],
                maxImageFileSize: 5000000, // Max 5MB
            },
            (error, result) => {
                if (!error && result && result.event === 'success') {
                    console.log('Done uploading Cloudinary image:', result.info);
                    setProfileImageUrl(result.info.secure_url);
                    setError('');
                } else if (error) {
                    console.error('Cloudinary upload error:', error);
                    setError("Image upload failed: " + error.message);
                }
            }
        );
        widget.open();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!currentUser) {
            setError("You must be logged in to create/update a profile.");
            setLoading(false);
            return;
        }
        if (username.trim() === '') {
            setError("Username cannot be empty.");
            setLoading(false);
            return;
        }

        try {
            // Update Firebase Auth profile
            await updateProfile(currentUser, {
                displayName: username.trim(),
                photoURL: profileImageUrl,
            });
            console.log('Firebase Auth profile updated (displayName, photoURL)');

            const userDocRef = doc(db, "users", currentUser.uid);

            let createdAt = new Date();
            if (isEditingExistingProfile) {
                const existingDoc = await getDoc(userDocRef);
                if (existingDoc.exists()) {
                    createdAt = existingDoc.data().createdAt;
                }
            }

            await setDoc(userDocRef, {
                username: username.trim(),
                email: currentUser.email,
                bio: bio.trim(),
                photoURL: profileImageUrl,
                createdAt: createdAt,
                lastUpdated: new Date(),
            }, { merge: true });

            console.log('User profile data saved/updated');
            console.log('Profile created/updated successfully');

            navigate('/profile');
        } catch (err) {
            console.error("An error occurred while creating/updating your profile:", err);
            setError("Failed to create/update profile: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="flex flex-1 justify-center items-center py-5" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
                <p className="text-[#111418] text-base font-normal leading-normal">Please log in or sign up to create your profile.</p>
                <button onClick={() => navigate('/login')} className="ml-4 px-4 py-2 rounded-lg bg-[#0c7ff2] text-white text-base font-bold leading-normal">Go to Login</button>
            </div>
        );
    }

    return (
        <>
            <div className="relative flex size-full min-h-screen flex-col bg-white overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
                <div className="layout-container flex h-full grow flex-col">
                    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f5] px-10 py-3">
                        <div className="flex items-center gap-4 text-[#111418]">
                            <div className="size-4">
                                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"
                                        fill="currentColor"
                                    ></path>
                                </svg>
                            </div>
                            <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">TrekMate</h2>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#f0f2f5] text-[#111418] text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50"
                        >
                            <span className="truncate">{loading ? 'Saving...' : 'Next'}</span>
                        </button>
                    </header>

                    <div className="px-40 flex flex-1 justify-center py-5">
                        <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5 max-w-\[960px] flex-1">
                            <h2 className="text-[#111418] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
                                {isEditingExistingProfile ? 'Edit your profile' : 'Create your profile'}
                            </h2>

                            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                                <label className="flex flex-col min-w-40 flex-1">
                                    <p className="text-[#111418] text-base font-medium leading-normal pb-2">Username</p>
                                    <input
                                        placeholder="@username"
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border border-[#dbe0e6] bg-white focus:border-[#dbe0e6] h-14 placeholder:text-[#60758a] p-[15px] text-base font-normal leading-normal"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </label>
                            </div>

                            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                                <label className="flex flex-col min-w-40 flex-1">
                                    <p className="text-[#111418] text-base font-medium leading-normal pb-2">Bio (optional)</p>
                                    <textarea
                                        placeholder="Tell us a bit about yourself"
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border border-[#dbe0e6] bg-white focus:border-[#dbe0e6] min-h-36 placeholder:text-[#60758a] p-[15px] text-base font-normal leading-normal"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                    ></textarea>
                                </label>
                            </div>

                            <h3 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Profile photo</h3>
                            <div className="flex flex-col p-4">
                                <div className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-[#dbe0e6] px-6 py-14">
                                    <div className="flex max-w-[480px] flex-col items-center gap-2">
                                        {/* Profile Image Preview: Use profileImageUrl as the single source */}
                                        {profileImageUrl && (
                                            <img
                                                src={profileImageUrl}
                                                alt="Profile Preview"
                                                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 mb-4"
                                            />
                                        )}
                                        <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] max-w-[480px] text-center">Add a photo</p>
                                        <p className="text-[#111418] text-sm font-normal leading-normal max-w-[480px] text-center">Recommended size: 1000x1000px</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleImageUpload}
                                        className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#f0f2f5] text-[#111418] text-sm font-bold leading-normal tracking-[0.015em]"
                                    >
                                        <span className="truncate">{profileImageUrl ? 'Change Image' : 'Upload Image'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CreateProfile;