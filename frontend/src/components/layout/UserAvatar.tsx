import type { FC } from 'react';

interface UserAvatarProps {
  username: string;
}

const UserAvatar: FC<UserAvatarProps> = ({ username }) => {
  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="w-10 h-10 flex items-center justify-center text-lg font-bold bg-primary-light text-text-accent rounded-full">
      {getInitial(username)}
    </div>
  );
};

export default UserAvatar;
