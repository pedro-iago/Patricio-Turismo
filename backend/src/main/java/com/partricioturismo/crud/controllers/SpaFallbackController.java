package com.partricioturismo.crud.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaFallbackController {

    @RequestMapping(value = {
            "/",
            "/{path:[^\\.]*}",
            "/**/{path:(?!api|assets)[^\\.]*}"
    })
    public String forwardToSpa() {
        return "forward:/index.html";
    }
}