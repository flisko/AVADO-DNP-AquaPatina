import styles from '../styles/Home.module.css';
import axios from 'axios';
import { server_config } from "../config";
import React, { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";

// // import { StyledDropZone } from 'react-drop-zone';
// const react_drop_zone = require('react-drop-zone');

import Dropzone from 'react-dropzone'
import { debug } from 'console';

export const RestoreBackup = ({ network }: { network: string }) => {

    const [collapsed, setCollapsed] = React.useState(false);
    const [backupFile, setBackupFile] = React.useState<File | null>();
    const [backupFileContent, setBackupFileContent] = React.useState<string>();

    type result = {
        status: "restored" | "error" | "restoring" | "validating" | "valid" | null
        message: string
    }

    const [result, setResult] = React.useState<result>({ status: null, message: "" });


    useEffect(() => {

        const verifyAndSet = async (backupFile: File) => {
            const setError = (message: string) => {
                setResult({ status: "error", message: `The uploaded file is not a valid config backup (${message})` })
                setBackupFileContent(undefined)
            }
            const backupContent = backupFile ? await backupFile?.text() : null

            if (!backupContent) {
                setError("no content")
                return
            }

            console.log("Validating backup file:", backupFile?.name)

            try {
                const content = JSON.parse(backupContent);

                // Backup file should at least have these fields
                if (
                    content?.password
                    && content?.network
                    && content?.keyfile
                ) {
                    if (content.network !== network) {
                        setError(`backup has wrong network (was:${content.network}, expect:${network})`)
                    } else {
                        setResult({ status: "valid", message: "Valid config file, ready for restoring" })
                        setBackupFileContent(backupContent)
                    }

                } else {
                    setError("missing items in backup file")
                }

            } catch (e) {
                setError(e as string)
                return
            }
        }

        if (backupFile) {
            setResult({ status: "validating", message: "Verifying backup file" })
            verifyAndSet(backupFile)
        }
    }, [backupFile, network]);

    const restoreBackup = () => {
        const element = document.createElement("a");
        setBackupFileContent(undefined)
        setResult({ status: "restoring", message: "Restoring backup" })

        axios.post(`${server_config.monitor_url}/restoreBackup`, { backup: backupFileContent })
            .then((res) => {
                if (res)
                    setResult({ status: "restored", message: "Successfully restored SSV operator config." })
                else
                    setResult({ status: "error", message: "Failed restoring SSV operator config." })
            })
            .catch(e => {
                console.error(e)
                setResult({ status: "error", message: JSON.stringify(e.response.data) })
            });
    }

    const getResultTag = () => {
        switch (result.status) {
            case "error": return "is-danger";
            case "validating": return "is-warning";
            case "restoring": return "is-warning";
            default: return "is-success";
        }
    }

    // TODO: why are angledown and up icons not visible?
    return (
        <>
            <div>
                <p className="text-sm pb-4">(backup file is called <b>aqua-patina-ssv-{network}-backup.json</b>)</p>
                <div className="content">
                    <div className="field is-horizontal">
                        <label className="field-label has-text-black">Config backup file (required):</label>
                        <div className="field-body">
                            <div className="file has-name">
                                <label className="file-label"><input className="file-input" type="file" name="keystore" id="keystore" onChange={e => setBackupFile(e.target?.files?.item(0))} />
                                    <span className="file-cta">
                                        <span className="file-icon">
                                            <FontAwesomeIcon icon={faUpload} />
                                        </span>
                                        <span className="file-label">
                                            Choose config file…
                                        </span>
                                    </span>
                                    <span className="file-name">
                                        {backupFile ? backupFile.name : "No file uploaded"}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="field is-grouped">
                        <label className="field-label has-text-black">{/* Left empty for spacing*/}</label>
                        <div className="field-body">
                            <div className="control">
                                <button className="button is-link" onClick={restoreBackup} disabled={!backupFileContent}>Restore config file from backup</button>
                            </div>
                        </div>
                    </div>
                    {result.message && (<p className={"tag " + getResultTag()}>{result.message}</p>)}
                </div>
            </div>


        </>

    );
};


