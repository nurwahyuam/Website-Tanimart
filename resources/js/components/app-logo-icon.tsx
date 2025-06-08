import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img src="/favicon.svg" alt="TaniMart Logo" {...props} />
    );
}
