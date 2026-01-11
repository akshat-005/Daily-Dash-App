import React, { useState, useEffect } from 'react';

interface TypewriterGreetingProps {
    userName: string;
}

const TypewriterGreeting: React.FC<TypewriterGreetingProps> = ({ userName }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [hasTyped, setHasTyped] = useState(false);

    const fullText = `Hi, ${userName}! 👋`;

    useEffect(() => {
        // Only type once per session
        if (hasTyped) {
            setDisplayedText(fullText);
            return;
        }

        let currentIndex = 0;
        const typingInterval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                setDisplayedText(fullText.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(typingInterval);
                setHasTyped(true);
            }
        }, 50); // 50ms per character

        return () => clearInterval(typingInterval);
    }, [fullText, hasTyped]);

    return (
        <div className="text-left">
            <h1 className="text-white text-2xl md:text-3xl font-bold">
                {displayedText}
                {!hasTyped && <span className="animate-pulse">|</span>}
            </h1>
            <p className="text-white/60 text-sm mt-1">Let's make today productive</p>
        </div>
    );
};

export default TypewriterGreeting;
