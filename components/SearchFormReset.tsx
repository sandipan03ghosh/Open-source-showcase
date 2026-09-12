"use client";
import Link from "next/link";
import {X} from "lucide-react";
const SearchFormReset = () => {
    const reset=()=> {
        // Reset the search input form is server side component but the button is still client side.
        const form=document.querySelector('.search-form') as HTMLFormElement;
        if(form) form.reset();
    }
    return (
        <Link
            href="/"
            className="search-btn text-white"
            onClick={reset}
            >
            <X className="size-5" />
        </Link>
    )
}
export default SearchFormReset;