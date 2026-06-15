import { Application, extend, useApplication } from "@pixi/react";
import { Container, Graphics, Sprite } from "pixi.js";

extend({ Container, Graphics, Sprite });

export function Supercluster() {
    return (
        <Application resizeTo={window} background={0x050810}>
            <SuperclusterWorld />
        </Application>
    )
}

function SuperclusterWorld() {
    //const { app, isInitialised } = useApplication();
    return <></>
}